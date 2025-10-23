import { Module } from '@nestjs/common';
import { InternalController } from './internal.controller';
import { PrismaService } from '../common/prisma.service';

@Module({ controllers: [InternalController], providers: [PrismaService] })
export class InternalModule {}
