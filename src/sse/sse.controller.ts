import { Controller, MessageEvent, Sse } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

const bus = new Subject<MessageEvent>();
export const publish = (type: string, data: any) =>
  bus.next({ type, data } as any);

@Controller('sse')
export class SseController {
  @Sse('stream')
  stream(): Observable<MessageEvent> {
    return bus.asObservable();
  }
}
