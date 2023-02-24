import { Controller, Get, Query, UseGuards,  } from '@nestjs/common';
import { AppService } from './app.service';
import { RateLimitGuard } from './guard/rateLimit.guard';
import { Transport, MicroserviceOptions, MessagePattern } from '@nestjs/microservices';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @UseGuards(RateLimitGuard)
  // @MessagePattern(Transport.TCP)
  @Get('data')
  async fetchData ( @Query() query ): Promise<any> {
    return await this.appService.fetchData()
  }

  @Get('test')
  async testRedis (): Promise<any> {
    return await this.appService.testRedis()
  }

}
