import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RateLimitGuard } from './guard/rateLimit.guard';
import { UtilsModule } from './util/utils.module';
import { ScheduleModule } from '@nestjs/schedule'
import { WSModule } from './ws/ws.module';
import { WSGateway } from './ws/ws.gateway';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env']
    }),
    UtilsModule,
    WSModule,
    ScheduleModule.forRoot()
  ],
  controllers: [AppController],
  providers: [
    AppService,
    UtilsModule,
    // {
    //   provide: APP_GUARD,
    //   useClass: RateLimitGuard
    // }
  ],
})
export class AppModule {}