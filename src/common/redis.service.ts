import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  client: Redis;
  constructor() {
    this.client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }
  async get(key: string) {
    return this.client.get(key);
  }
  async set(key: string, val: string, ttlSec?: number) {
    return ttlSec
      ? this.client.set(key, val, 'EX', ttlSec)
      : this.client.set(key, val);
  }
  async del(key: string) {
    return this.client.del(key);
  }
  async setnx(key: string, val: string, ttlSec?: number) {
    const ok = await this.client.setnx(key, val);
    if (ok && ttlSec) await this.client.expire(key, ttlSec);
    return ok;
  }
}
