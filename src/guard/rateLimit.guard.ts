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
    const request = context.switchToHttp().getRequest()
    const ip:string = this.getIp(request)
    const id:string = this.getId(request)
    const ipRequestRecord = await this.redisUtil.getIpRequestRecord(ip) 
    const idRequestRecord = await this.redisUtil.getIdRequestRecord(id)
    let records = {ip, id, ipRequestRecord, idRequestRecord}
    this.checkRate(records) 
    const currentTime = this.getCurrentTime()
    await this.saveRequestIdAndIPInfo(records, currentTime)
    return (true)
  }

  getIp(request){
    return request.headers['x-forwarded-for'] || request.socket.remoteAddress
  }

  getId(request){
    return request.query.user
  }

  getCurrentTime(){
    return new Date()
  }

  checkRate(records){
    const expire = this.getExpireTime()
    const countIp = this.getCountIp(records.ipRequestRecord, expire)
    const countId = this.getCountId(records.idRequestRecord, expire)
    const error = {ip: countIp,id:countId}
    if( this.ipRequestOverLimit(countIp) || this.idRequestOverLimit(countId) ) throw new HttpException(error, HttpStatus.TOO_MANY_REQUESTS)
  }

  getCountIp(ipRequestRecord, expire){
    return (ipRequestRecord === null) ? 0 : this.countIpRequestsInOneMin(ipRequestRecord, expire)
  }

  getCountId(idRequestRecord, expire){
    return (idRequestRecord === null) ? 0 : this.countIdRequestsInOneMin(idRequestRecord, expire)
  }

  ipRequestOverLimit(countIp){
    return (countIp >= 10)
  }

  idRequestOverLimit(countId){
    return (countId >= 5)
  }

  countIpRequestsInOneMin(ipRequestRecord, expire){
    let countIp = 0
    for( let i = 0 ; i < ipRequestRecord.length ; i++){
      countIp = this.addCountIfIpRequestTimeInOneMin(ipRequestRecord[i], expire, countIp)
    }
    return countIp
  }

  addCountIfIpRequestTimeInOneMin(ipRequestRecord, expire, countIp){
    if( this.requestTimeInOneMin(ipRequestRecord, expire) ) countIp++
    return countIp
  }

  countIdRequestsInOneMin(idRequestRecord, expire){
    let countId = 0
    for( let i = 0 ; i < idRequestRecord.length ; i++){
      countId = this.addCountIfIdRequestTimeInOneMin(idRequestRecord[i], expire, countId)
    }
    return countId
  }

  addCountIfIdRequestTimeInOneMin(idRequestRecord, expire, countId){
    if( this.requestTimeInOneMin(idRequestRecord, expire) ) countId++
    return countId
  }

  requestTimeInOneMin(requestTime, expire){
    return (Date.parse(requestTime) > expire)
  }

  getExpireTime(){
    let date = new Date()
    return date.setMinutes(date.getMinutes() - 1)
  }

  async saveRequestIdAndIPInfo(records,currentTime){
    records.ipRequestRecord === null ? records.ipRequestRecord = [currentTime] : records.ipRequestRecord.push(currentTime)
    records.idRequestRecord === null ? records.idRequestRecord = [currentTime] : records.idRequestRecord.push(currentTime)
    try{
      await this.redisUtil.saveIpRequestRecord(records.ip, records.ipRequestRecord)
      await this.redisUtil.saveIdRequestRecord(records.id, records.idRequestRecord)
    }catch(err){
      console.log('abc',err)
    }
  }
}
