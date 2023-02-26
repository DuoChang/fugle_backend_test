import { Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { RedisUtilService } from '../util/redisUtil'
import { channels } from './bitstampChannels'
import { WSGateway } from './ws.gateway'

@Injectable()
export class OHLCService {
  constructor (
    private readonly redisUtil: RedisUtilService,
    private readonly wsgateway: WSGateway
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async sendOHLCDataToSubscribers () {
    for( let i = 0 ; i < channels.length ; i++ ){
      let subscribers: Array<string> = await this.redisUtil.getSubscribeValue(channels[i])
      let deals: Array<number> = await this.redisUtil.getBitstampValue(channels[i])
      await this.redisUtil.setBitStampValue(channels[i],[])
      if( subscribers.length != 0 && deals.length !=0 ){
        let OHLCdata = {
          max: Math.max.apply(null, deals),
          min: Math.min.apply(null, deals),
          first: deals[0],
          last: deals[(deals.length-1)]
        }
        await this.wsgateway.sendPrice(subscribers, JSON.stringify(OHLCdata))
      }
    }
  }
}
