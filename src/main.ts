import { NestFactory } from '@nestjs/core'
import { ValidationPipe, HttpException, HttpStatus } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { ConfigService } from '@nestjs/config'
import { Logger, systemLogger } from './util/logUtil'
import helmet from 'helmet'
import { AppModule } from './app.module'

async function bootstrap () {
  const app = await NestFactory.create(AppModule, {
    logger: new Logger()
  })

  app.useGlobalPipes(new ValidationPipe())
  app.use(helmet())
  app.enableCors({
    origin: ['*', 'http://localhot:8080'],
    credentials: true
  })

  const swaggerOptions = new DocumentBuilder()
    .setTitle('fugle_backend_test')
    .setDescription('fugle_backend_test')
    .setVersion('1.0')
    .build()
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerOptions, {
    include: [
      AppModule
    ]
  })
  SwaggerModule.setup('api', app, swaggerDocument)
  const configService = app.get(ConfigService)
  const NODE_PORT = configService.get('NODE_PORT')

  await app.listen(NODE_PORT ?? 3000, () => {
    systemLogger.info(`Listen succefully at port:${NODE_PORT}`)
  })
}

bootstrap().catch((err) => {
  systemLogger.error(err)
  throw new HttpException(err, HttpStatus.INTERNAL_SERVER_ERROR)
})
