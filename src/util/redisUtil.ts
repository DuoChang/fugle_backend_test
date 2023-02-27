import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient } from 'redis'

@Injectable()
export class RedisUtilService {
  constructor (
    private readonly configService: ConfigService
  ) {}

  async createNewClientConnection() {
    const client = createClient({ url: this.configService.get('redisURL') })
    client.connect().catch((error) => { throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR) })
    client.on('error', error => { throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR) })
    return client
  }

  async getRequestRecords (field: string): Promise<string[]> {
    const client = await this.createNewClientConnection()
    const result = JSON.parse(await client.hGet('request', field))
    await client.disconnect()
    return result
  }

  async saveRequestRecords (field: string, requestRecords: string[]): Promise<void> {
    const client = await this.createNewClientConnection()
    await client.hSet('request', field, JSON.stringify(requestRecords))
    await client.disconnect()
  }

  async getRedisKeys (): Promise<string[]> {
    const client = await this.createNewClientConnection()
    const result = await client.keys('*')
    await client.disconnect()
    return result
  }

  async deleteRedisKey (key: string): Promise<void> {
    const client = await this.createNewClientConnection()
    await client.del(key)
    await client.disconnect()
  }

  async getBitstampValue (field: string): Promise<number[]> {
    const client = await this.createNewClientConnection()
    const result = JSON.parse(await client.hGet('bitstamp', field))
    await client.disconnect()
    return result
  }

  async setBitStampValue (field: string, value: number[]): Promise<void> {
    const client = await this.createNewClientConnection()
    await client.hSet('bitstamp', field, JSON.stringify(value))
    await client.disconnect()
  }

  async deleteBitstampField (field: string): Promise<void> {
    const client = await this.createNewClientConnection()
    await client.hDel('bitstamp', field)
    await client.disconnect()
  }

  async getSubscribeValue (field: string): Promise<string[]> {
    const client = await this.createNewClientConnection()
    const result = JSON.parse(await client.hGet('subscribe', field))
    await client.disconnect()
    return result
  }

  async setSubscribeValue (field: string, value: string[]): Promise<void> {
    const client = await this.createNewClientConnection()
    await client.hSet('subscribe', field, JSON.stringify(value))
    await client.disconnect()
  }
}
