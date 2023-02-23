import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { createClient } from 'redis';
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env' })
const redisURL = process.env.REDIS_URL

const client = createClient({
  url: redisURL
});

client.on('error', err =>{throw new HttpException(err,HttpStatus.INTERNAL_SERVER_ERROR)} )
client.connect()

@Injectable()
export class RedisUtilService {
  constructor () {
  }

  // static readonly pageSize: number = 5

  async getIpRequestRecord(ip: string): Promise<Array<string>> {
    // console.log('enter getIpRequestRecord')
    return JSON.parse(await client.get(ip))
  }

  async getIdRequestRecord (id: string): Promise<Array<string>> {
    // console.log('enter getIdRequestRecord')
    return JSON.parse(await client.get(id))
  }

  async saveIpRequestRecord (ip: string, ipRequestRecord:Array<string>): Promise<void> {
    // console.log('enter saveIpRequestRecord')
    await client.set(ip, JSON.stringify(ipRequestRecord))
  }

  async saveIdRequestRecord (id: string, idRequestRecord:Array<string>): Promise<void> {
    // console.log('enter saveIdRequestRecord')
    await client.set(id, JSON.stringify(idRequestRecord))
  }
}