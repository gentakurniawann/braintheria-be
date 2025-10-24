import { IsOptional, IsString, IsNumber } from 'class-validator';

export class UpdateQuestionDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  bodyMd?: string;

  @IsOptional()
  @IsString()
  bounty?: string;

  @IsOptional()
  @IsNumber()
  id?: number;
}
