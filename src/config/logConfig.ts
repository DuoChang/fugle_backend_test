import * as dotenv from 'dotenv'
dotenv.config()
dotenv.config({ path: '.env' })
const logPath = process.env.LOGPATH
const appName = process.env.APPNAME

const logConfig = {
  appenders: {
    log: {
      type: 'dateFile',
      filename: `${logPath}/backend/logs/fugle-backend-test.log`,
      alwaysIncludePattern: true,
      layout: {
        type: 'pattern',
        pattern: `[%d][%p][%c][%l][${appName}] - %m`
      },
      pattern: 'yyyy-MM-dd',
      numBackups: 10,
      keepFileExt: true
    },
    error: {
      type: 'dateFile',
      filename: `${logPath}/backend/errors/fugle-backend-test.error`,
      alwaysIncludePattern: true,
      layout: {
        type: 'pattern',
        pattern: `[%d][%p][%c][%l][${appName}] - %m`
      },
      pattern: 'yyyy-MM-dd',
      numBackups: 10,
      keepFileExt: true

    }
  },
  categories: {
    default: {
      appenders: ['log'],
      level: 'DEBUG'
    },
    error: {
      appenders: ['error'],
      level: 'ERROR'
    }
  }
}

export default logConfig
