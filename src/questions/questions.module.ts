import { Module } from '@nestjs/common';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';
import { PrismaService } from '../common/prisma.service';
import { IpfsModule } from '../ipfs/ipfs.module';
import { HashingModule } from '../hashing/hashing.module';
import { ChainModule } from '../chain/chain.module';
import { UsersModule } from '../users/users.module';
import { LedgerModule } from 'src/ledger/ledger.module';

@Module({
  imports: [IpfsModule, HashingModule, ChainModule, UsersModule, LedgerModule],
  controllers: [QuestionsController],
  providers: [QuestionsService, PrismaService],
})
export class QuestionsModule {}
