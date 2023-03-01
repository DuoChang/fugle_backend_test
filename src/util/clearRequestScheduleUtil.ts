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
    const fields: string[] = await this.redisUtil.getRequestFields()
    await this.clearRecordsExpiredByKey(fields, expireTime)
  }

  get1MinBeforeDatetime (): Date {
    let date = new Date()
    date.setMinutes(date.getMinutes() - 1)
    return date
  }

  async clearRecordsExpiredByKey (fields: string[], expireTime: Date): Promise<void | undefined> {
    for (let i = 0; i < fields.length; i++) {
      const requestRecords: string[] = await this.redisUtil.getRequestRecords(fields[i])
      if (requestRecords !== null) {
        const unexpiredRequestRecords: string[] = await this.retainRecordsUnexpire(requestRecords, expireTime)
        await this.saveOrDeleteKey(fields[i], unexpiredRequestRecords)
      }
    }
  }

  async retainRecordsUnexpire (requestRecords: string[], expireTime: Date): Promise<string[]> {
    let unexpiredRequestRecords = requestRecords.filter((item) => {
      return (Date.parse(item) > expireTime.getTime())
    })
    return unexpiredRequestRecords
  }

  async saveOrDeleteKey (field: string, requestRecords: string[]): Promise<void> {
    requestRecords.length === 0 ? await this.redisUtil.deleteRequestField(field) : await this.redisUtil.saveRequestRecords(field, requestRecords)
  }
}
