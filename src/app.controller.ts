import { Controller, Get, Query, UseFilters  } from '@nestjs/common'
import { AppService } from './app.service'
import { HttpExceptionFilter } from './ExceptionFilters/http-exception.filters'

@UseFilters(HttpExceptionFilter)
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('data')
  async fetchData ( @Query() query ): Promise<any> {
    return await this.appService.fetchData()
  }

}
