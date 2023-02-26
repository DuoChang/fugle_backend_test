import { Injectable } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { RedisUtilService } from './redisUtil'

@Injectable()
export class ClearRequestScheduleUtilService {
  constructor (
    private readonly redisUtil: RedisUtilService
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async clearRequestRecordsExpired () {
    const expireTime: Date = this.get1MinBeforeDatetime()
    const keys: string[] = await this.redisUtil.getRedisKeys()
    await this.clearRecordsExpiredByKey(keys, expireTime)
  }

  get1MinBeforeDatetime (): Date {
    let date = new Date()
    date.setMinutes(date.getMinutes() - 1)
    return date
  }

  async clearRecordsExpiredByKey (keys: string[], expireTime: Date): Promise<void | undefined> {
    for (let i = 0; i < keys.length; i++) {
      const requestRecords: string[] = await this.redisUtil.getRequestRecords(keys[i])
      if (requestRecords === null) return void (0)
      const unexpiredRequestRecords: string[] = await this.retainRecordsUnexpire(requestRecords, expireTime)
      await this.saveOrDeleteKey(keys[i], unexpiredRequestRecords)
    }
  }

  async retainRecordsUnexpire (requestRecords: string[], expireTime: Date): Promise<string[]> {
    let unexpiredRequestRecords = requestRecords.filter((item) => {
      return (Date.parse(item) > expireTime.getTime())
    })
    return unexpiredRequestRecords
  }

  async saveOrDeleteKey (key: string, requestRecords: string[]): Promise<void> {
    requestRecords.length === 0 ? await this.redisUtil.deleteRedisKey(key) : await this.redisUtil.saveRequestRecords(key, requestRecords)
  }
}
