import { Module } from '@nestjs/common'
import { ClearRequestScheduleUtilService } from './clearRequestScheduleUtil'
import { RedisUtilService } from './redisUtil'

@Module({
  imports: [],
  providers: [
    RedisUtilService,
    ClearRequestScheduleUtilService
  ],
  exports: [
    RedisUtilService,
    ClearRequestScheduleUtilService
  ]
})
export class UtilsModule {
}
