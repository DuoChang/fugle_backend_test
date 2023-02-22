import { LoggerService } from '@nestjs/common'
import * as log4js from 'log4js'
import logConfig from '../config/logConfig'

export enum loggerLevel {
  ALL = 'ALL',
  TRACE = 'TRACE',
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL',
  OFF = 'OFF'
}

log4js.configure(logConfig)

export const systemLogger = log4js.getLogger('default')
systemLogger.level = loggerLevel.ALL

const appLogger = log4js.getLogger('default')
appLogger.level = loggerLevel.DEBUG
const errorLogger = log4js.getLogger('error')
errorLogger.level = loggerLevel.ERROR

export class Logger implements LoggerService {
  log (message: string) {
    appLogger.info(message)
  }

  error (message: string) {
    errorLogger.error(message)
  }

  warn (message: string) {
    appLogger.warn(message)
  }

  debug (message: string) {
    appLogger.debug(message)
  }

  verbose (message: string) {
    appLogger.trace(message)
  }
}
