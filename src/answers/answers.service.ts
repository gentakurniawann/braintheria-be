import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { IpfsService } from '../ipfs/ipfs.service';
import { HashingService } from '../hashing/hashing.service';
import { AnswerDto } from '../dto/answer.dto';
import { publish } from '../sse/sse.controller';
import { SignerService } from 'src/chain/signer.service';

@Injectable()
export class AnswersService {
  constructor(
    private prisma: PrismaService,
    private ipfs: IpfsService,
    private hashing: HashingService,
    private signerService: SignerService,
  ) {}

  async create(qId: number, userId: number, dto: AnswerDto) {
    if (!qId || isNaN(qId))
      throw new BadRequestException('Invalid question ID.');
    if (!userId || isNaN(userId))
      throw new BadRequestException('Invalid user ID.');
    if (!dto?.bodyMd?.trim())
      throw new BadRequestException('Answer body cannot be empty.');

    // --- Find the question ---
    const question = await this.prisma.question.findUnique({
      where: { id: qId },
      select: { id: true, authorId: true, status: true, chainQId: true },
    });
    if (!question) throw new NotFoundException('Question not found.');
    if (question.authorId === userId)
      throw new ForbiddenException('You cannot answer your own question.');
    if (question.status !== 'Open')
      throw new BadRequestException('You can only answer open questions.');

    // --- Prepare IPFS data ---
    const contentHash = this.hashing.computeContentHash(dto.bodyMd);
    const pinned = await this.ipfs.pinJson({
      questionId: qId,
      bodyMd: dto.bodyMd,
      files: dto.files || [],
    });

    // --- Save to DB first (temporary record) ---
    const answer = await this.prisma.answer.create({
      data: {
        questionId: qId,
        authorId: userId,
        bodyMd: dto.bodyMd,
        ipfsCid: pinned.cid,
        contentHash,
      },
    });

    // --- Sync to blockchain ---
    if (!question.chainQId)
      throw new BadRequestException(
        'No on-chain question ID found for this question.',
      );

    try {
      //  Call contract postAnswer(questionId, contentHash)
      const tx = await this.signerService.answerQuestion(
        question.chainQId,
        contentHash,
      );

      const receipt = await tx.wait();
      // console.log(' Answer posted on-chain:', receipt.hash);

      // --- Extract the event AnswerPosted(answerId) ---
      const event = receipt.logs
        .map((log) => {
          try {
            return this.signerService.contract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((parsed) => parsed && parsed.name === 'AnswerPosted');

      const chainAId = event?.args?.answerId?.toString();

      // --- Update DB with chainAId ---
      await this.prisma.answer.update({
        where: { id: answer.id },
        data: { chainAId: chainAId ? Number(chainAId) : null },
      });

      // --- Publish event for live updates ---
      publish('answer:created', { id: answer.id, questionId: qId });

      return {
        success: true,
        message: ' Answer created successfully and synced to blockchain.',
        data: {
          id: answer.id,
          questionId: qId,
          chainAId,
          txHash: receipt.hash,
          ipfsCid: pinned.cid,
        },
      };
    } catch (error) {
      console.error('❌ Failed to post answer on-chain:', error);
      throw new BadRequestException('Failed to sync answer to blockchain');
    }
  }
}
