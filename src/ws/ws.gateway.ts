import {
    MessageBody,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    WsResponse,
} from '@nestjs/websockets';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Server } from 'socket.io';
  
  @WebSocketGateway({
    port: 3000,
    namespace: 'streaming',
    transports: ['polling','websocket'],
    path: '/',
    cors: {
      origin: ['*','http://localhost:8080'],
      credentials: true
    },
    allowEIO3: true
  })
export class WSGateway {
    @WebSocketServer()
    server: Server;
  
    @SubscribeMessage('btcusd')
    async identity(@MessageBody() data: string): Promise<any> {
      console.log('hi')
      const a = 'HI'
      const event = 'btcusd'
      return {event, data: a};
    }
  }