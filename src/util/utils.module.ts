import { Module } from '@nestjs/common'
// import { ScheduleUtilService } from './scheduleUtil'
import { RedisUtilService } from './redisUtil'

@Module({
  imports: [],
  providers: [
    RedisUtilService
  ],
  exports: [
    RedisUtilService
  ]
})
export class UtilsModule {
}
