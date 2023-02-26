import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv'
import * as WebSocket from "ws";
import { WSGateway } from './ws.gateway';
import { channels } from './bitstampChannels'
import { RedisUtilService } from 'src/util/redisUtil';

@Injectable()
export class BitstampService {

  constructor (
    private readonly configService: ConfigService,
    private readonly redisUtil: RedisUtilService,
    private readonly wsgateway: WSGateway
  ) {
    try{
      const wss = new WebSocket(this.configService.get('WEBSOCKET_URL'), {
        perMessageDeflate: false
      })
      wss.on('error', console.error)
      wss.on('open', async function open() {
        console.log('connected')
        for( let i = 0 ; i < channels.length ; i++ ){
          const subscribeChannel = {
            "event": "bts:subscribe",
            "data": {
                "channel": `live_trades_${channels[i]}`
            }
          }
          await wss.send(JSON.stringify(subscribeChannel))
          await redisUtil.setBitStampValue(channels[i],[])
        }
        // const subscribeChannel = {
        //   "event": "bts:subscribe",
        //   "data": {
        //       "channel": 'live_trades_btcusd'
        //   }
        // }
        // wss.send(JSON.stringify(subscribeChannel))
      })
      wss.on('message', async function message(data) {
        const dealInfo = JSON.parse(data.toString())
        // console.log('dealInfo',dealInfo)
        const channel = dealInfo.channel.split('_')
        let subscribers = await redisUtil.getBitstampValue(channel[2])
        if( subscribers !== null && subscribers !== undefined ) await wsgateway.sendPrices(subscribers,dealInfo)
      });
    }catch(error){
      console.log('connection error',error)
    }
  }
}
