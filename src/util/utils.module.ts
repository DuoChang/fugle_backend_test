import { Module } from '@nestjs/common'
import { ScheduleUtilService } from './scheduleUtil'
import { RedisUtilService } from './redisUtil'

@Module({
  imports: [],
  providers: [
    RedisUtilService,
    ScheduleUtilService
  ],
  exports: [
    RedisUtilService,
    ScheduleUtilService
  ]
})
export class UtilsModule {
}
