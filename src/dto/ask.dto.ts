export class AskDto {
  title: string;
  bodyMd: string;
  files?: { name: string; cid: string; size: number }[];
}
