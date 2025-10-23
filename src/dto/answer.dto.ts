export class AnswerDto {
  bodyMd: string;
  files?: { name: string; cid: string; size: number }[];
}
