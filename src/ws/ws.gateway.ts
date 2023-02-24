import {
    MessageBody,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    WsResponse,
    ConnectedSocket,
    OnGatewayDisconnect
} from '@nestjs/websockets'
import { from, Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { Socket } from 'socket.io'
import { Server } from 'ws';
import { RedisUtilService } from 'src/util/redisUtil';

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
    server: Server
  
    @SubscribeMessage('subscribe')
    async subscribe(@ConnectedSocket() client: Socket, @MessageBody() data: any): Promise<any> {
      console.log('enter subscribe')
      const channel: string = data.channel
      const clientSubscribedChannels = await this.redisUtil.getValue(client.id)
      await this.verifySubscribeChanneLimit(clientSubscribedChannels)
      await this.verifyDuplicateSubscribe(clientSubscribedChannels, channel)
      await this.updateClientSubscribedChannels(client, clientSubscribedChannels, channel)
      await this.updateChannelSubscribers(client, channel)
    }

    async verifySubscribeChanneLimit(clientSubscribedChannels){
      if( this.isNotEmpty(clientSubscribedChannels) && this.isLimit(clientSubscribedChannels) ) return {event:'subscribe',data: '最多 subscribe 10 個 currency pair'}
    }

    isLimit(clientSubscribedChannels){
      return (clientSubscribedChannels.length === 10)
    }

    async verifyDuplicateSubscribe(clientSubscribedChannels, channel){
      if( this.isNotEmpty(clientSubscribedChannels) && this.isRepeat(clientSubscribedChannels,channel) ) return {event:'subscribe',data: '重複 subscribe'}
    }

    isRepeat(clientSubscribedChannels, channel){
      return (clientSubscribedChannels.includes(channel))
    }

    async updateClientSubscribedChannels(client, clientSubscribedChannels, channel){
      let newSubscribedChannels = this.isNotEmpty(clientSubscribedChannels) ? clientSubscribedChannels.push(channel) : [channel]
      await this.redisUtil.setValue(client.id,newSubscribedChannels)
    }

    isNotEmpty(clientSubscribedChannels){
      return (clientSubscribedChannels !== null)
    }

    async updateChannelSubscribers(client, channel){
      const subscribers = await this.redisUtil.getValue(channel)
      let newSubscribers: string[]
      if(subscribers === null){
        // newSubscribers = [JSON.stringify(client)]
        newSubscribers = [client.toString()]
      }else{
        // subscribers.push(JSON.stringify(client))
        subscribers.push(client.toString())
        newSubscribers = subscribers
      }
      console.log('check:',channel)
      console.log('check2:',newSubscribers)
      await this.redisUtil.setValue(channel,newSubscribers)
    }

    @SubscribeMessage('unsubscribe')
    async unsubscribe(@ConnectedSocket() client: Socket, @MessageBody() data: any): Promise<any> {
      const channel = data.channel
      await this.deleteChannelFromClientId(client.id, channel)
      await this.deleteClientIdFromChannel(channel, client.id)
    }

    async deleteClientIdFromChannel(channel, id){
      let subscribers = await this.redisUtil.getValue(channel)
      console.log('check subscribers:', subscribers)
      await this.getNewSubscriberArray(subscribers, id)
      await this.redisUtil.setValue(channel,subscribers)
    }

    async getNewSubscriberArray(subscribers, id){
      let newSubscriberArray = subscribers.filter((item)=>{
        console.log('check item:', item)
        let client = JSON.parse(item)
        console.log('check cliend id:', client.id)
        return client.id != id
      })
      return newSubscriberArray
    }

    async deleteChannelFromClientId(id, channel){
      let  clientSubscribedChannels = await this.redisUtil.getValue(id)
      await this.verifySubscribedChannel(clientSubscribedChannels,channel)
      const newClientSubscribedChannels = await this.getNewClientSubscribeChannels(clientSubscribedChannels, channel)
      await this.redisUtil.setValue(id,newClientSubscribedChannels)
    }

    async verifySubscribedChannel(clientSubscribedChannels, channel){
      if( this.isNotEmpty(clientSubscribedChannels) && this.isNotSubscribe(clientSubscribedChannels, channel) ) return {event:'unsubscribe',data: '未 subscribe 此 channel'}
    }

    isNotSubscribe(clientSubscribedChannels, channel){
      return (!clientSubscribedChannels.includes(channel))
    }

    async getNewClientSubscribeChannels(clientSubscribedChannels, channel){
      let newClientSubscribedChannels = clientSubscribedChannels.filter((item)=>{
        return item != channel
      })
      return newClientSubscribedChannels
    }

    async handleDisconnect(client: Socket){
      await this.deleteClientIdFromChannels(client.id)
      await this.redisUtil.deleteRedisKey(client.id)
    }

    async deleteClientIdFromChannels(id){
      const clientSubscribedChannels = await this.redisUtil.getValue(id)
      if( clientSubscribedChannels === null ) return void(0)
      for( let i = 0 ; i < clientSubscribedChannels.length ; i++ ){
        await this.deleteClientIdFromChannel(clientSubscribedChannels[i], id)
      }
    }

    // static async sendPrices(prices){
    //   if (subscribers.length === 0) return void(0)
    //   const client = subscribers[0]
    //   console.log('prices:',prices)
    //   client.send(prices)
    // }
  }