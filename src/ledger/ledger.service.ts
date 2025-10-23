import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class LedgerService {
  constructor(private prisma: PrismaService) {}

  addEntry(data: {
    userId?: number;
    questionId?: number;
    kind: string;
    amountWei: string;
    token?: string;
    ref?: string;
    txHash?: string;
  }) {
    return this.prisma.ledger.create({ data: { token: 'ETH', ...data } });
  }
}
