import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { CheckoutDto } from '../dto/checkout.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('bounties')
export class BountiesController {
  @Post(':id/checkout')
  @UseGuards(JwtAuthGuard)
  async checkout(
    @Param('id') qId: string,
    @Body() dto: CheckoutDto,
    @Req() req: any,
  ) {
    // Normally call PSP createCheckoutSession here and return URL
    return {
      checkoutUrl: `https://psp.example/checkout?ref=q${qId}&amt=${dto.amountWei}`,
      ref: `pspSession_${Date.now()}`,
    };
  }
}