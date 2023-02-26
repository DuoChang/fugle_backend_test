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
          await redisUtil.setSubscribeValue(channels[i],[])
        }
        // const subscribeChannel = {
        //   "event": "bts:subscribe",
        //   "data": {
        //       "channel": 'live_trades_btcusd'
        //   }
        // }
        // wss.send(JSON.stringify(subscribeChannel))
        // await redisUtil.setSubscribeValue('btcusd',[])
      })
      wss.on('message', async function message(data) {
        // send latest price
        const dealInfo = JSON.parse(data.toString())
        if( dealInfo.event != 'trade' ) return void(0)
        const channel: string = dealInfo.channel.split('_')[2]
        const price: number = dealInfo.data.price
        let subscribers = await redisUtil.getSubscribeValue(channel)
        let message: string = `${channel}: ${price}`
        if( subscribers !== null && subscribers !== undefined && subscribers.length != 0 ) await wsgateway.sendPrice(subscribers,message)
        // save latest price
        let dealsOfChannel = await redisUtil.getBitstampValue(channel)
        if( dealsOfChannel === null ){
          dealsOfChannel = [price]
        }else{
          dealsOfChannel.push(price)
        }
        await redisUtil.setBitStampValue(channel, dealsOfChannel)
      });
    }catch(error){
      console.log(error)
    }
  }
}
