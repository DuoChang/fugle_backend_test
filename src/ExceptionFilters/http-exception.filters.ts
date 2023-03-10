import { type ExceptionFilter, Catch, type ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common'
import { HttpAdapterHost } from '@nestjs/core'

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
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
    const responseBody = this.getResponseBody(exception)
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

  getResponseBody (exception: any) {
    return exception.response
  }
}
