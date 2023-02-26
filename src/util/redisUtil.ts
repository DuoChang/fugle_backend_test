import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { createClient } from 'redis'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env' })
const redisURL = process.env.REDIS_URL

const client = createClient({
  url: redisURL
})

client.on('error', error => { throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR) })
client.connect().catch((error) => { throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR) })

@Injectable()
export class RedisUtilService {
  async getRequestRecords (field: string): Promise<string[]> {
    return JSON.parse(await client.hGet('request', field))
  }

  async getBitstampValue (field: string): Promise<number[]> {
    return JSON.parse(await client.hGet('bitstamp', field))
  }

  async getSubscribeValue (field: string): Promise<string[]> {
    return JSON.parse(await client.hGet('subscribe', field))
  }

  async saveRequestRecords (field: string, requestRecords: string[]): Promise<void> {
    await client.hSet('request', field, JSON.stringify(requestRecords))
  }

  async setBitStampValue (field: string, value: number[]): Promise<void> {
    await client.hSet('bitstamp', field, JSON.stringify(value))
  }

  async setSubscribeValue (field: string, value: string[]): Promise<void> {
    await client.hSet('subscribe', field, JSON.stringify(value))
  }

  async getRedisKeys (): Promise<string[]> {
    return await client.keys('*')
  }

  async deleteRedisKey (key: string): Promise<void> {
    await client.del(key)
  }

  async deleteBitstampField (field: string): Promise<void> {
    await client.hDel('bitstamp', field)
  }
}
