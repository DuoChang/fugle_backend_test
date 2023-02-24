import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv'
import * as WebSocket from "ws";
import { WSGateway } from './ws.gateway';
import { channels } from './bitstampChannels'
import { RedisUtilService } from 'src/util/redisUtil';

// dotenv.config({ path: '.env' })
// const websocketURL = process.env.WEBSOCKET_URL
// const wss = new WebSocket(websocketURL, {
//   perMessageDeflate: false
// })

@Injectable()
export class BitstampService {
  
  // private wss = new WebSocket(websocketURL, {
  //   perMessageDeflate: false
  // })

  // private wss = new WebSocket(this.configService.get('WEBSOCKET_URL'), {
  //   perMessageDeflate: false
  // })

  constructor (
    private readonly configService: ConfigService,
    private readonly redisUtil: RedisUtilService
  ) {
    const wss = new WebSocket(this.configService.get('WEBSOCKET_URL'), {
      perMessageDeflate: false
    })
    wss.on('error', console.error)
    wss.on('open', function open() {
      console.log('connected')
      // for( let i = 0 ; i < channels.length ; i++ ){
      //   const subscribeChannel = {
      //     "event": "bts:subscribe",
      //     "data": {
      //         "channel": `live_trades_${channels[i]}`
      //     }
      //   }
      //   wss.send(JSON.stringify(subscribeChannel))
      //   this.redisUtil.saveRequestRecords(channels[i],[])
      // }
      // const subscribeChannel = {
      //   "event": "bts:subscribe",
      //   "data": {
      //       "channel": 'live_trades_btcusd'
      //   }
      // }
      // wss.send(JSON.stringify(subscribeChannel))
    })
    wss.on('message', function message(data) {
      // console.log('check:',data)
      // WSGateway.sendPrices(data)
    });
  }
}
