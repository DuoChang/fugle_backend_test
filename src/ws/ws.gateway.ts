import { Injectable } from '@nestjs/common'
import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  type WsResponse,
  ConnectedSocket,
  WsException
} from '@nestjs/websockets'
import { Socket, Server } from 'socket.io'
import { RedisUtilService } from 'src/util/redisUtil'
import { HttpExceptionFilter } from 'src/ExceptionFilters/http-exception.filters'

@Injectable()
@WebSocketGateway({
  transports: ['polling', 'websocket'],
  path: '/streaming',
  cors: {
    origin: ['*', 'http://localhost:8080'],
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
  async handleEvent (@ConnectedSocket() client: Socket, @MessageBody() data: any): Promise<WsResponse<string> | WsException> {
    try {
      const channel: string = data.channel
      const clientSubscribedChannels: string[] = await this.redisUtil.getSubscribeValue(client.id)
      await this.verifySubscribeChanneLimit(clientSubscribedChannels)
      await this.verifyDuplicateSubscribe(clientSubscribedChannels, channel)
      await this.updateClientSubscribedChannels(client.id, clientSubscribedChannels, channel)
      await this.updateChannelSubscribers(client.id, channel)
      return { event: 'subscribe', data: 'subscribe success' }
    } catch (error) {
      throw new WsException(error)
    }
  }

  async verifySubscribeChanneLimit (clientSubscribedChannels: string[]): Promise<void | WsException> {
    if (this.isLimit(clientSubscribedChannels)) throw new WsException('最多 subscribe 10 個 currency pair')
  }

  isLimit (clientSubscribedChannels: string[]): boolean {
    return this.isNotEmpty(clientSubscribedChannels) ? (clientSubscribedChannels.length === 10) : false
  }

  async verifyDuplicateSubscribe (clientSubscribedChannels: string[], channel: string): Promise<void | WsException> {
    if (this.isRepeat(clientSubscribedChannels, channel)) throw new WsException('重複 subscribe')
  }

  isRepeat (clientSubscribedChannels: string[], channel: string): boolean {
    return this.isNotEmpty(clientSubscribedChannels) ? (clientSubscribedChannels.includes(channel)) : false
  }

  async updateClientSubscribedChannels (id: string, clientSubscribedChannels, channel: string): Promise<void> {
    let newSubscribedChannels
    if (this.isNotEmpty(clientSubscribedChannels)) {
      clientSubscribedChannels.push(channel)
      newSubscribedChannels = clientSubscribedChannels
    } else {
      newSubscribedChannels = [channel]
    }
    await this.redisUtil.setSubscribeValue(id, newSubscribedChannels)
  }

  isNotEmpty (array: string[]): boolean {
    return (array !== null)
  }

  async updateChannelSubscribers (id: string, channel: string): Promise<void> {
    const subscribers: string[] = await this.redisUtil.getSubscribeValue(channel)
    let newSubscribers: string[]
    if (subscribers === null) {
      newSubscribers = [id]
    } else {
      subscribers.push(id)
      newSubscribers = subscribers
    }
    await this.redisUtil.setSubscribeValue(channel, newSubscribers)
  }

  @SubscribeMessage('unsubscribe')
  async unsubscribe (@ConnectedSocket() client: Socket, @MessageBody() data: any): Promise<WsResponse<string> | WsException> {
    try {
      const channel: string = data.channel
      await this.deleteChannelFromClientId(client.id, channel)
      await this.deleteClientIdFromChannel(channel, client.id)
      return { event: 'unsubscribe', data: 'unsubscribe success' }
    } catch (error) {
      throw new WsException(error)
    }
  }

  async deleteClientIdFromChannel (channel: string, id: string): Promise<void> {
    let subscribers: string[] = await this.redisUtil.getSubscribeValue(channel)
    let newSubscribers: string[] = await this.getNewSubscriberArray(subscribers, id)
    await this.redisUtil.setSubscribeValue(channel, newSubscribers)
  }

  async getNewSubscriberArray (subscribers: string[], id: string): Promise<string[]> {
    let newSubscriberArray: string[] = subscribers.filter((item) => {
      return item !== id
    })
    return newSubscriberArray
  }

  async deleteChannelFromClientId (id: string, channel: string): Promise<void | WsException> {
    let clientSubscribedChannels: string[] = await this.redisUtil.getSubscribeValue(id)
    await this.verifySubscribedChannel(clientSubscribedChannels, channel)
    const newClientSubscribedChannels: string[] = await this.getNewClientSubscribeChannels(clientSubscribedChannels, channel)
    await this.redisUtil.setSubscribeValue(id, newClientSubscribedChannels)
  }

  async verifySubscribedChannel (clientSubscribedChannels: string[], channel: string): Promise<void | WsException> {
    if (this.isNotSubscribe(clientSubscribedChannels, channel)) throw new WsException('未 subscribe 此 channel')
  }

  isNotSubscribe (clientSubscribedChannels: string[], channel: string): boolean {
    return (this.isNotEmpty(clientSubscribedChannels)) ? (!clientSubscribedChannels.includes(channel)) : true
  }

  async getNewClientSubscribeChannels (clientSubscribedChannels: string[], channel: string): Promise<string[]> {
    let newClientSubscribedChannels: string[] = clientSubscribedChannels.filter((item) => {
      return item !== channel
    })
    return newClientSubscribedChannels
  }

  async handleDisconnect (client: Socket): Promise<void> {
    try {
      await this.deleteClientIdFromChannels(client.id)
      await this.redisUtil.deleteBitstampField(client.id)
    } catch (error) {
      throw new HttpExceptionFilter(error)
    }
  }

  async deleteClientIdFromChannels (id: string): Promise<void> {
    const clientSubscribedChannels: string[] = await this.redisUtil.getSubscribeValue(id)
    if (this.isEmpty(clientSubscribedChannels)) return void (0)
    for (let i = 0; i < clientSubscribedChannels.length; i++) {
      await this.deleteClientIdFromChannel(clientSubscribedChannels[i], id)
    }
  }

  isEmpty (array: string[]): boolean {
    return (array === null)
  }

  public sendPrice (subscribers: string[], message: string) {
    subscribers.forEach(element => {
      this.server.to(element).emit('message', message)
    })
  }
}
