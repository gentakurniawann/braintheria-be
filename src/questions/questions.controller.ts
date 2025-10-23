import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  Request,
  BadRequestException,
  Patch,
  Delete,
  ForbiddenException,
  NotFoundException,
  ParseIntPipe,
} from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { AskDto } from '../dto/ask.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UsersService } from 'src/users/users.service';
import { ChainReadService } from 'src/chain/chain-read.service';
import { UpdateQuestionDto } from '../dto/update-question.dto';

@Controller('questions')
export class QuestionsController {
  constructor(
    private svc: QuestionsService,
    private readonly usersService: UsersService,
    private readonly chainRead: ChainReadService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: AskDto, @Request() req) {
    const user = await this.usersService.getById(req.user.sub);

    if (!user) throw new BadRequestException('User not found.');
    if (!user.primaryWallet)
      throw new BadRequestException(
        'User wallet not connected. Please connect your wallet before posting a question with a bounty.',
      );

    const userQuestion = {
      id: user.id,
      walletAddress: user.primaryWallet,
    };

    return this.svc.create(userQuestion, dto);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMyQuestions(
    @Request() req,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: string,
  ) {
    const user = await this.usersService.getById(req.user.sub);
    if (!user) throw new BadRequestException('User not found.');

    return this.svc.list({
      userId: user.id,
      page: Number(page),
      limit: Number(limit),
      status,
    });
  }

  @Get('chain')
  @UseGuards(JwtAuthGuard)
  async getAllChainQuestions() {
    return this.chainRead.listAllQuestions();
  }

  @Get('chain/:id')
  @UseGuards(JwtAuthGuard)
  async getChainQuestion(@Param('id') id: string) {
    return this.chainRead.getQuestion(Number(id));
  }

  @Get()
  async list(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: string, // optional filter
  ) {
    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    return this.svc.list({
      page: pageNumber,
      limit: limitNumber,
      status,
    });
  }

  @Get('by-email')
  getByMail(@Query('email') email?: string) {
    return this.svc.listByMail(email);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getById(@Param('id') id: string) {
    return this.svc.getById(Number(id));
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateQuestionDto,
    @Request() req,
  ) {
    const user = await this.usersService.getById(req.user.sub);
    if (!user) throw new BadRequestException('User not found.');

    const question = await this.svc.getById(Number(id));
    if (!question) throw new NotFoundException('Question not found.');

    if (question.authorId !== user.id)
      throw new ForbiddenException('You can only edit your own question.');

    if (question.status !== 'Open')
      throw new BadRequestException('Only open questions can be edited.');

    return this.svc.update(Number(id), dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string, @Request() req) {
    const user = await this.usersService.getById(req.user.sub);
    if (!user) throw new BadRequestException('User not found.');

    const question = await this.svc.getById(Number(id));
    if (!question) throw new NotFoundException('Question not found.');

    if (question.authorId !== user.id)
      throw new ForbiddenException('You can only delete your own question.');

    if (question.status !== 'Open')
      throw new BadRequestException('Only open questions can be deleted.');

    return this.svc.delete(Number(id));
  }

  @Patch(':questionId/approve-answer/:answerId')
  @UseGuards(JwtAuthGuard)
  async approveAnswer(
    @Param('questionId') questionId: number,
    @Param('answerId') answerId: number,
    @Request() req,
  ) {
    const userId = req.user.sub;
    return this.svc.approveAnswer(+questionId, +answerId, userId);
  }

  @Patch(':id/bounty/add')
  @UseGuards(JwtAuthGuard)
  add(@Param('id', ParseIntPipe) id: number, @Body() body: { addEth: number }) {
    return this.svc.addBounty(id, body.addEth);
  }

  @Patch(':id/bounty/reduce')
  @UseGuards(JwtAuthGuard)
  reduce(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { reduceEth: number },
  ) {
    return this.svc.reduceBounty(id, body.reduceEth);
  }
}
