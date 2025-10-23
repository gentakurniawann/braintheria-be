import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Controller('ledger')
export class LedgerController {
  constructor(private prisma: PrismaService) {}

  @Get()
  list(@Query('questionId') questionId?: string) {
    return this.prisma.ledger.findMany({
      where: { questionId: questionId ? Number(questionId) : undefined },
    });
  }
}
