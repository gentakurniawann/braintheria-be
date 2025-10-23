import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { ChainModule } from '../chain/chain.module';
import { LedgerModule } from '../ledger/ledger.module';
import { RedisService } from '../common/redis.service';

@Module({
  imports: [ChainModule, LedgerModule],
  controllers: [WebhookController],
  providers: [RedisService],
})
export class WebhookModule {}
