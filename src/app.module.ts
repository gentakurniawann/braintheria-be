import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { QuestionsModule } from './questions/questions.module';
import { AnswersModule } from './answers/answers.module';
import { LedgerModule } from './ledger/ledger.module';
import { BountiesModule } from './bounties/bounties.module';
import { WebhookModule } from './webhook/webhook.module';
import { InternalModule } from './internal/internal.module';
import { SseModule } from './sse/sse.module';
import { ChainModule } from './chain/chain.module';
import { IpfsModule } from './ipfs/ipfs.module';
import { HashingModule } from './hashing/hashing.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
    UsersModule,
    QuestionsModule,
    AnswersModule,
    LedgerModule,
    BountiesModule,
    WebhookModule,
    InternalModule,
    SseModule,
    ChainModule,
    IpfsModule,
    HashingModule,
  ],
})
export class AppModule {}
