import { Module } from '@nestjs/common';
import { BountiesController } from './bounties.controller';
import { LedgerModule } from '../ledger/ledger.module';

@Module({
  imports: [LedgerModule],
  controllers: [BountiesController],
})
export class BountiesModule {}
