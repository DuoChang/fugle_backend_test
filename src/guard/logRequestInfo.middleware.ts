import { Injectable, type NestMiddleware, Logger } from '@nestjs/common'
import { type Request, type Response } from 'express'

@Injectable()
export class LogRequestInfoMiddleware implements NestMiddleware {
  use (req: Request, res: Response, next: Function) {
    const requestInfo = {
      METHOD: req.method,
      API_NAME: `${req.originalUrl}`,
      STATUS: req.statusCode,
      HOSTNAME: req.headers.host,
      BODY: req.body,
      QUERY: req.query
    }
    Logger.log(JSON.stringify(requestInfo))
    next()
  }
}
