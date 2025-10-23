import { Injectable } from '@nestjs/common';
import { keccak256, toBytes } from 'viem';

function normalizeMarkdown(md: string) {
  return md.replace(/\r\n/g, '\n').trim().replace(/\s+/g, ' ');
}

@Injectable()
export class HashingService {
  computeContentHash(md: string) {
    const norm = normalizeMarkdown(md);
    return keccak256(toBytes(norm));
  }
}
