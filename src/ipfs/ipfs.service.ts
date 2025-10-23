import { Injectable } from '@nestjs/common';

@Injectable()
export class IpfsService {
  async pinJson(obj: any) {
    // TODO: replace with real pinning service
    return { cid: 'bafyMockCid' };
  }
}
