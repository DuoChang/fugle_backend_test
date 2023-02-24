import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RateLimitGuard } from './guard/rateLimit.guard';
import { UtilsModule } from './util/utils.module';
import { ScheduleModule } from '@nestjs/schedule'
import { WSModule } from './ws/ws.module';
import { WSGateway } from './ws/ws.gateway';
import { LogRequestInfoMiddleware } from './guard/logRequestInfo.middleware';

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
    WSModule
    // {
    //   provide: APP_GUARD,
    //   useClass: RateLimitGuard
    // }
  ],
})
export class AppModule implements NestModule {
  configure (consumer: MiddlewareConsumer) {
    consumer
      .apply(LogRequestInfoMiddleware)
      .forRoutes(
        '*'
      )
  }
}