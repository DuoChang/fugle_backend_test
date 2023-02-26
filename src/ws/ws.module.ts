import { Module } from '@nestjs/common'
import { UtilsModule } from 'src/util/utils.module'
import { BitstampService } from './bitstamp.service'
import { OHLCService } from './OHLC.service'
import { WSGateway } from './ws.gateway'

@Module({
  imports: [
    UtilsModule
  ],
  providers: [
    WSGateway,
    BitstampService,
    OHLCService
  ],
  exports: [
    WSGateway,
    BitstampService,
    OHLCService
  ]
})
export class WSModule {}
