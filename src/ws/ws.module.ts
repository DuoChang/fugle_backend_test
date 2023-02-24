import { Module } from '@nestjs/common';
import { UtilsModule } from 'src/util/utils.module';
import { BitstampService } from './bitstamp.service';
import { WSGateway } from './ws.gateway';

@Module({
  imports: [
    UtilsModule
  ],
  providers: [
    WSGateway,
    BitstampService
  ],
  exports: [
    WSGateway,
    BitstampService
  ]
})
export class WSModule {}