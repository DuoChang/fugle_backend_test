import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { RateLimitGuard } from './guard/rateLimit.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @UseGuards(RateLimitGuard)
  @Get('data')
  async fetchData ( @Query() query ): Promise<any> {
    return await this.appService.fetchData()
  }

  @Get('test')
  async testRedis (): Promise<any> {
    return await this.appService.testRedis()
  }

}
