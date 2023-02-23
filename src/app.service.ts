import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'
import axios from 'axios'
import { RedisUtilService } from './util/redisUtil';

@Injectable()
export class AppService {

  constructor (
    private readonly configService: ConfigService,
    private readonly redisUtil: RedisUtilService
  ) {}
  
  async fetchData(): Promise<any> {
    try{
      const fetchDataURL = this.configService.get('FETCH_DATA_URL')
      const fetchData = await axios.get(fetchDataURL)
      const result = fetchData.data
      return { result }
    }catch(error){
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }

  async testRedis(): Promise<any>{
    await this.redisUtil.getRedisKeys()
  }
}
