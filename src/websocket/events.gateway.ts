import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: true })
export class EventsGateway {
  @WebSocketServer()
  server!: Server;

  emitTrade(data: unknown): void {
    this.server.emit('trade', data);
  }
}
