import { Injectable, CanActivate, ExecutionContext,HttpException, HttpStatus } from '@nestjs/common'
import { Observable } from 'rxjs'
import { RedisUtilService } from 'src/util/redisUtil'


@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor (
    private readonly redisUtil: RedisUtilService
  ) {}

  async canActivate (
    context: ExecutionContext
  ): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest()
    const ip:string = this.getIp(request)
    const id:string = this.getId(request)
    const ipRequestRecord: Array<string> | null = await this.redisUtil.getRequestRecords(ip) 
    const idRequestRecord: Array<string> | null = await this.redisUtil.getRequestRecords(id)
    let records = {ip, id, ipRequestRecord, idRequestRecord}
    this.checkRate(records) 
    const currentTime: Date = this.getCurrentTime()
    await this.saveRequestIdAndIPInfo(records, currentTime)
    return (true)
  }

  getIp(request): string{
    return request.headers['x-forwarded-for'] || request.socket.remoteAddress
  }

  getId(request): string{
    return request.query.user
  }

  getCurrentTime(): Date{
    return new Date()
  }

  checkRate(records): void{
    const expire: Date = this.getExpireTime()
    const countIp: number = this.getCountIp(records.ipRequestRecord, expire)
    const countId: number = this.getCountId(records.idRequestRecord, expire)
    const error = {ip: countIp,id:countId}
    if( this.ipRequestOverLimit(countIp) || this.idRequestOverLimit(countId) ) throw new HttpException(error, HttpStatus.TOO_MANY_REQUESTS)
  }

  getCountIp(ipRequestRecord: Array<string>, expire: Date): number{
    return (ipRequestRecord === null) ? 0 : this.countRequestsInOneMin(ipRequestRecord, expire)
  }

  getCountId(idRequestRecord: Array<string>, expire: Date): number{
    return (idRequestRecord === null) ? 0 : this.countRequestsInOneMin(idRequestRecord, expire)
  }

  ipRequestOverLimit(countIp: number): boolean{
    return (countIp >= 10)
  }

  idRequestOverLimit(countId: number): boolean{
    return (countId >= 5)
  }

  countRequestsInOneMin(requestRecords: Array<string>, expire: Date): number{
    let count = 0
    for( let i = 0 ; i < requestRecords.length ; i++){
      count = this.addCountIfRequestTimeInOneMin(requestRecords[i], expire, count)
    }
    return count
  }

  addCountIfRequestTimeInOneMin(requestRecord: string, expire: Date, count: number): number{
    if( this.requestTimeInOneMin(requestRecord, expire) ) count++
    return count
  }

  requestTimeInOneMin(requestTime: string, expire: Date): boolean{
    return (Date.parse(requestTime) > expire.getTime())
  }

  getExpireTime(): Date{
    let date = new Date()
    date.setMinutes(date.getMinutes() - 1)
    return date
  }

  async saveRequestIdAndIPInfo(records,currentTime: Date): Promise<void>{
    records.ipRequestRecord === null ? records.ipRequestRecord = [currentTime] : records.ipRequestRecord.push(currentTime)
    records.idRequestRecord === null ? records.idRequestRecord = [currentTime] : records.idRequestRecord.push(currentTime)
    try{
      await this.redisUtil.saveRequestRecords(records.ip, records.ipRequestRecord)
      await this.redisUtil.saveRequestRecords(records.id, records.idRequestRecord)
    }catch(error){
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR)
    }
  }
}
