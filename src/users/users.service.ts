import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }
  create(data: { email: string; name?: string }) {
    return this.prisma.user.create({ data });
  }
  getById(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }
  setPrimaryWallet(userId: number, address: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { primaryWallet: address },
    });
  }
}


