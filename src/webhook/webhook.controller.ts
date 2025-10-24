import { Body, Controller, Post } from '@nestjs/common';
import { SignerService } from '../chain/signer.service';
import { LedgerService } from '../ledger/ledger.service';
import { RedisService } from '../common/redis.service';
import { publish } from '../sse/sse.controller';

@Controller('webhooks')
export class WebhookController {
  constructor(
    private signer: SignerService,
    private ledger: LedgerService,
    private redis: RedisService,
  ) {}

  @Post('psp')
  async handlePsp(@Body() body: any) {
    // 1) Verify signature (stub)
    // 2) Idempotency check
    const id = body?.eventId || `evt_${body?.ref}`;
    const ok = await this.redis.setnx(`psp:${id}`, '1', 3600);
    if (!ok) return { ok: true, deduped: true };

    const qId = Number(body?.questionId);
    const amountWei = BigInt(body?.amountWei || '0');
    const payerId = Number(body?.userId || 0);

    // 3) On payment succeeded -> fund on-chain
    const txHash = await this.signer.fundBounty(qId, amountWei);

    // 4) Mirror to ledger
    await this.ledger.addEntry({
      kind: 'topup->fund',
      amountWei: amountWei.toString(),
      ref: body?.ref,
      txHash,
      questionId: qId,
      userId: payerId,
    });

    // 5) Notify
    publish('bounty:update', { qId });

    return { ok: true, txHash };
  }
}
