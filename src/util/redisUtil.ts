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

  async getRequestRecords(key: string): Promise<Array<string>> {
    return JSON.parse(await client.get(key))
  }

  async getValue(key: string): Promise<Array<string>> {
    return JSON.parse(await client.get(key))
  }

  async saveRequestRecords (key: string, requestRecords:Array<string>): Promise<void> {
    await client.set(key, JSON.stringify(requestRecords))
  }

  async setValue (key: string, requestRecords:Array<string>): Promise<void> {
    await client.set(key, JSON.stringify(requestRecords))
  }

  async getRedisKeys(): Promise<Array<string>> {
    return await client.keys('*')
  }

  async deleteRedisKey(key:string): Promise<void> {
    await client.del(key)
  }
}
