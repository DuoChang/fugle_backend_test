import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import {
    MessageBody,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    WsResponse,
    ConnectedSocket,
    OnGatewayDisconnect, 
    WsException
} from '@nestjs/websockets'
import { from, Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { Socket, Server } from 'socket.io'
// import { Server } from 'ws';
import { RedisUtilService } from 'src/util/redisUtil';

@Injectable()
@WebSocketGateway({
  transports: ['polling','websocket'],
  path: '/streaming',
  cors: {
    origin: ['*','http://localhost:8080'],
    credentials: true
  },
  allowEIO3: true
})
export class WSGateway {

  constructor (
    private readonly redisUtil: RedisUtilService
  ) {}
    @WebSocketServer()
    public server: Server
  
    @SubscribeMessage('subscribe')
    async handleEvent(@ConnectedSocket() client: Socket, @MessageBody() data: any): Promise<WsResponse<string> | WsException> {
      const channel: string = data.channel
      const clientSubscribedChannels: Array<string> = await this.redisUtil.getBitstampValue(client.id)
      await this.verifySubscribeChanneLimit(clientSubscribedChannels)
      await this.verifyDuplicateSubscribe(clientSubscribedChannels, channel)
      await this.updateClientSubscribedChannels(client.id, clientSubscribedChannels, channel)
      await this.updateChannelSubscribers(client.id, channel)
      return {event: 'subscribe', data: 'subscribe success'}
    }

    async verifySubscribeChanneLimit(clientSubscribedChannels: Array<string>): Promise<void | WsException>{
      if( this.isLimit(clientSubscribedChannels) ) throw new WsException({event:'subscribe',data: '最多 subscribe 10 個 currency pair'})
    }

    isLimit(clientSubscribedChannels: Array<string>): boolean{
      return this.isNotEmpty(clientSubscribedChannels) ? (clientSubscribedChannels.length === 10) : false
    }

    async verifyDuplicateSubscribe(clientSubscribedChannels: Array<string>, channel: string): Promise<void | WsException>{
      if( this.isRepeat(clientSubscribedChannels,channel) ) throw new WsException({event:'subscribe',data: '重複 subscribe'})
    }

    isRepeat(clientSubscribedChannels: Array<string>, channel: string): boolean{
      return this.isNotEmpty(clientSubscribedChannels) ? (clientSubscribedChannels.includes(channel)) : false
    }

    async updateClientSubscribedChannels(id: string, clientSubscribedChannels, channel: string): Promise<void>{
      let newSubscribedChannels
      if(this.isNotEmpty(clientSubscribedChannels)){
        clientSubscribedChannels.push(channel)
        newSubscribedChannels = clientSubscribedChannels
      }else{
        newSubscribedChannels = [channel]
      }
      await this.redisUtil.setBitStampValue(id,newSubscribedChannels)
    }

    isNotEmpty(clientSubscribedChannels: Array<string>): boolean{
      return (clientSubscribedChannels !== null)
    }

    async updateChannelSubscribers(id: string, channel: string): Promise<void>{
      const subscribers: Array<string> = await this.redisUtil.getBitstampValue(channel)
      let newSubscribers: string[]
      if(subscribers === null){
        newSubscribers = [id]
      }else{
        subscribers.push(id)
        newSubscribers = subscribers
      }
      await this.redisUtil.setBitStampValue(channel,newSubscribers)
    }

    @SubscribeMessage('unsubscribe')
    async unsubscribe(@ConnectedSocket() client: Socket, @MessageBody() data: any): Promise<WsResponse<string> | WsException> {
      const channel: string = data.channel
      await this.deleteChannelFromClientId(client.id, channel)
      await this.deleteClientIdFromChannel(channel, client.id)
      return {event: 'unsubscribe', data: 'unsubscribe success'}
    }

    async deleteClientIdFromChannel(channel: string, id: string): Promise<void>{
      let subscribers: Array<string> = await this.redisUtil.getBitstampValue(channel)
      let newSubscribers: Array<string> = await this.getNewSubscriberArray(subscribers, id)
      await this.redisUtil.setBitStampValue(channel,newSubscribers)
    }

    async getNewSubscriberArray(subscribers: Array<string>, id: string): Promise<Array<string>>{
      let newSubscriberArray: Array<string> = subscribers.filter((item)=>{
        return item != id
      })
      return newSubscriberArray
    }

    async deleteChannelFromClientId(id: string, channel: string): Promise<void | WsException>{
      let  clientSubscribedChannels: Array<string> = await this.redisUtil.getBitstampValue(id)
      await this.verifySubscribedChannel(clientSubscribedChannels,channel)
      const newClientSubscribedChannels: Array<string> = await this.getNewClientSubscribeChannels(clientSubscribedChannels, channel)
      await this.redisUtil.setBitStampValue(id, newClientSubscribedChannels)
    }

    async verifySubscribedChannel(clientSubscribedChannels: Array<string>, channel: string): Promise<void | WsException>{
      if( this.isNotSubscribe(clientSubscribedChannels, channel) ) throw new WsException({event:'unsubscribe',data: '未 subscribe 此 channel'})
    }

    isNotSubscribe(clientSubscribedChannels: Array<string>, channel: string): boolean{
     return (this.isNotEmpty(clientSubscribedChannels)) ? (!clientSubscribedChannels.includes(channel)): true
    }

    async getNewClientSubscribeChannels(clientSubscribedChannels: Array<string>, channel: string): Promise<Array<string>>{
      let newClientSubscribedChannels: Array<string> = clientSubscribedChannels.filter((item)=>{
        return item != channel
      })
      return newClientSubscribedChannels
    }

    async handleDisconnect(client: Socket): Promise<void>{
      await this.deleteClientIdFromChannels(client.id)
      await this.redisUtil.deleteBitstampField(client.id)
    }

    async deleteClientIdFromChannels(id: string): Promise<void>{
      const clientSubscribedChannels: Array<string> = await this.redisUtil.getBitstampValue(id)
      if( clientSubscribedChannels === null ) return void(0)
      for( let i = 0 ; i < clientSubscribedChannels.length ; i++ ){
        await this.deleteClientIdFromChannel(clientSubscribedChannels[i], id)
      }
    }

    public async sendPrices(subscribers,dealInfo){
      // console.log('sendPrices',subscribers,dealInfo)
      subscribers.forEach(element => {
        this.server.to(element).emit('message',dealInfo)
      });
    }
  }