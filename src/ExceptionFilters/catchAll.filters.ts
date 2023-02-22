import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common'
import { HttpAdapterHost } from '@nestjs/core'

@Catch()
export class CatchAllExceptionsFilter implements ExceptionFilter {
  constructor (
    private readonly httpAdapterHost: HttpAdapterHost
  ) {}

  catch (exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost
    const ctx = host.switchToHttp()
    const httpStatus =
      exception instanceof HttpException
        ? this.getHttpStatus(exception)
        : HttpStatus.INTERNAL_SERVER_ERROR
    const path = httpAdapter.getRequestUrl(ctx.getRequest())
    const responseBody = this.getResponseBody(exception, path)
    Logger.error(JSON.stringify(responseBody))
    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus)
  }

  getHttpStatus (exception: any) {
    if (this.httpStatusIsUndefined(exception)) {
      return HttpStatus.INTERNAL_SERVER_ERROR
    } else {
      return exception.getStatus()
    }
  }

  httpStatusIsUndefined (exception: any): boolean {
    return (exception.getStatus() === undefined)
  }

  getResponseBody (exception: any, path: string) {
    if (this.exceptionIsHttpException(exception)) {
      return {
        message: exception.message,
        error: this.errorIfHttp(exception),
        path
      }
    } else {
      return {
        message: exception,
        error: exception,
        path
      }
    }
  }

  exceptionIsHttpException (exception: any): boolean {
    return (exception instanceof HttpException)
  }

  errorIfHttp (exception: any): any {
    if (this.stackIsNotUndefined(exception)) {
      return exception.response.stack
    } else {
      return exception.satck
    }
  }

  stackIsNotUndefined (exception: any): boolean {
    return (exception.response.stack !== undefined)
  }
}
