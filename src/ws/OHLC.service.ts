import { Injectable, UseFilters } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { RedisUtilService } from '../util/redisUtil'
import { channels } from './bitstampChannels'
import { WSGateway } from './ws.gateway'
import { HttpExceptionFilter } from 'src/ExceptionFilters/http-exception.filters'

@UseFilters(HttpExceptionFilter)
@Injectable()
export class OHLCService {
  constructor (
    private readonly redisUtil: RedisUtilService,
    private readonly wsgateway: WSGateway
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async sendOHLCDataToSubscribers () {
    try {
      for (let i = 0; i < channels.length; i++) {
        const subscribers: string[] = await this.redisUtil.getSubscribeValue(channels[i])
        const deals: number[] = await this.redisUtil.getBitstampValue(channels[i])
        await this.redisUtil.setBitStampValue(channels[i], [])
        if (subscribers.length !== 0 && deals.length !== 0) {
          const OHLCdata = {
            max: Math.max.apply(null, deals),
            min: Math.min.apply(null, deals),
            first: deals[0],
            last: deals[(deals.length - 1)]
          }
          this.wsgateway.sendPrice(subscribers, JSON.stringify(OHLCdata))
        }
      }
    } catch (error) {
      throw new HttpExceptionFilter(error)
    }
  }
}
