import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
  BadRequestException,
  ParseIntPipe,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { IpfsService } from '../ipfs/ipfs.service';
import { HashingService } from '../hashing/hashing.service';
import { AnswerDto } from '../dto/answer.dto';
import { publish } from '../sse/sse.controller';
import { UsersService } from 'src/users/users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AnswersService } from './answers.service';

@Controller('answers')
export class AnswersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ipfs: IpfsService,
    private readonly hashing: HashingService,
    private readonly usersService: UsersService,
    private svc: AnswersService,
  ) {}

  @Post(':qId')
  @UseGuards(JwtAuthGuard)
  async create(
    @Param('qId') qId: string,
    @Body() dto: AnswerDto,
    @Request() req,
  ) {
    // console.log(' Reached AnswersController.create');

    const id = Number(qId);
    if (isNaN(id)) throw new BadRequestException('Invalid question ID');

    const userId = req.user.sub;
    if (!userId) throw new BadRequestException('Invalid user.');

    return this.svc.create(id, userId, dto);
  }

  //GET all answers for a question
  @Get(':qId')
  async getAnswers(@Param('qId', ParseIntPipe) qId: number) {
    const answers = await this.prisma.answer.findMany({
      where: { questionId: qId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, name: true, primaryWallet: true } },
      },
    });

    return {
      questionId: qId,
      total: answers.length,
      answers,
    };
  }
}
