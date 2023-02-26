import { Injectable, UseFilters } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as WebSocket from 'ws'
import { WSGateway } from './ws.gateway'
import { channels } from './bitstampChannels'
import { RedisUtilService } from 'src/util/redisUtil'
import { HttpExceptionFilter } from 'src/ExceptionFilters/http-exception.filters'

@UseFilters(HttpExceptionFilter)
@Injectable()
export class BitstampService {
  constructor (
    private readonly configService: ConfigService,
    private readonly redisUtil: RedisUtilService,
    private readonly wsgateway: WSGateway
  ) {
    const wss = new WebSocket(this.configService.get('WEBSOCKET_URL'), {
      perMessageDeflate: false
    })

    wss.on('error', (error) => { throw new Error(error) })

    try {
      wss.on('open', async function open () {
        for (let i = 0; i < channels.length; i++) {
          const subscribeChannel = {
            'event': 'bts:subscribe',
            'data': {
              'channel': `live_trades_${channels[i]}`
            }
          }
          await wss.send(JSON.stringify(subscribeChannel))
          await redisUtil.setSubscribeValue(channels[i], [])
        }
      })

      wss.on('message', async function message (data: any) {
        // send latest price
        const dealInfo: any = JSON.parse(data.toString())
        if (dealInfo.event !== 'trade') return void (0)
        const channel: string = dealInfo.channel.split('_')[2]
        const price: number = dealInfo.data.price
        let subscribers: string[] = await redisUtil.getSubscribeValue(channel)
        let message: string = `${channel}: ${price}`
        if (subscribers !== null && subscribers !== undefined && subscribers.length !== 0) wsgateway.sendPrice(subscribers, message)
        // save latest price
        let dealsOfChannel: number[] = await redisUtil.getBitstampValue(channel)
        if (dealsOfChannel === null) {
          dealsOfChannel = [price]
        } else {
          dealsOfChannel.push(price)
        }
        await redisUtil.setBitStampValue(channel, dealsOfChannel)
      })
    } catch (error) {
      throw new HttpExceptionFilter(error)
    }
  }
}
