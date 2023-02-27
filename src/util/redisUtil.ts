import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createClient } from 'redis'

@Injectable()
export class RedisUtilService {
  constructor (
    private readonly configService: ConfigService
  ) {
    this.requestClient = createClient({ url: this.configService.get('redisURL') })
    this.bitstampClient = createClient({ url: this.configService.get('redisURL') })
    this.subscribeClient = createClient({ url: this.configService.get('redisURL') })
    this.requestClient.connect().catch((error) => { throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR) })
    this.bitstampClient.connect().catch((error) => { throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR) })
    this.subscribeClient.connect().catch((error) => { throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR) })
    this.requestClient.on('error', error => { throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR) })
    this.bitstampClient.on('error', error => { throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR) })
    this.requestClient.on('error', error => { throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR) })
  }

  private readonly requestClient
  private readonly bitstampClient
  private readonly subscribeClient

  async getRequestRecords (field: string): Promise<string[]> {
    return JSON.parse(await this.requestClient.hGet('request', field))
  }

  async saveRequestRecords (field: string, requestRecords: string[]): Promise<void> {
    await this.requestClient.hSet('request', field, JSON.stringify(requestRecords))
  }

  async getRedisKeys (): Promise<string[]> {
    const result = await this.requestClient.keys('*')
    return result
  }

  async deleteRedisKey (key: string): Promise<void> {
    await this.requestClient.del(key)
  }

  async getBitstampValue (field: string): Promise<number[]> {
    return JSON.parse(await this.bitstampClient.hGet('bitstamp', field))
  }

  async setBitStampValue (field: string, value: number[]): Promise<void> {
    await this.bitstampClient.hSet('bitstamp', field, JSON.stringify(value))
  }

  async deleteBitstampField (field: string): Promise<void> {
    await this.bitstampClient.hDel('bitstamp', field)
  }

  async getSubscribeValue (field: string): Promise<string[]> {
    return JSON.parse(await this.subscribeClient.hGet('subscribe', field))
  }

  async setSubscribeValue (field: string, value: string[]): Promise<void> {
    await this.subscribeClient.hSet('subscribe', field, JSON.stringify(value))
  }
}
