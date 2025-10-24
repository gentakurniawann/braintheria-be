import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class LeaderboardService {
  constructor(private prisma: PrismaService) {}

  async getTopUsers(limit = 10) {
    // Step 1: Count users by verified (isBest) answers
    const users = await this.prisma.user.findMany({
      take: limit,
      include: {
        _count: {
          select: {
            answers: {
              where: { isBest: true },
            },
          },
        },
      },
    });

    // Step 2: Sort manually (because Prisma can't order by filtered relation count yet)
    const sorted = users.sort(
      (a, b) => b._count.answers - a._count.answers, // descending
    );

    return sorted;
  }
}
