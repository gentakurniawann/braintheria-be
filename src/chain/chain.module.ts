import { Module } from '@nestjs/common';
import { ChainReadService } from './chain-read.service';
import { SignerService } from './signer.service';

@Module({
  providers: [ChainReadService, SignerService],
  exports: [ChainReadService, SignerService],
})
export class ChainModule {}
