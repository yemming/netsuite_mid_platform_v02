// 運行時日誌收集器
// 用於在開發環境中收集和顯示服務器日誌

interface LogEntry {
  id: string
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'success'
  message: string
  details?: string
}

class RuntimeLogger {
  private logs: LogEntry[] = []
  private maxLogs = 1000
  private originalConsole: {
    log: typeof console.log
    info: typeof console.info
    warn: typeof console.warn
    error: typeof console.error
  }

  constructor() {
    // 保存原始的 console 方法
    this.originalConsole = {
      log: console.log.bind(console),
      info: console.info.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
    }

    // 攔截 console 方法
    this.interceptConsole()
  }

  private interceptConsole() {
    const self = this

    console.log = (...args: any[]) => {
      self.originalConsole.log(...args)
      self.addLog('info', ...args)
    }

    console.info = (...args: any[]) => {
      self.originalConsole.info(...args)
      self.addLog('info', ...args)
    }

    console.warn = (...args: any[]) => {
      self.originalConsole.warn(...args)
      self.addLog('warn', ...args)
    }

    console.error = (...args: any[]) => {
      self.originalConsole.error(...args)
      self.addLog('error', ...args)
    }
  }

  private addLog(level: 'info' | 'warn' | 'error' | 'success', ...args: any[]) {
    const message = args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2)
        } catch {
          return String(arg)
        }
      }
      return String(arg)
    }).join(' ')

    const logEntry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      level,
      message,
    }

    this.logs.push(logEntry)

    // 保持日誌數量在限制內
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }
  }

  // 手動添加日誌
  public log(level: 'info' | 'warn' | 'error' | 'success', message: string, details?: string) {
    const logEntry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      level,
      message,
      details,
    }

    this.logs.push(logEntry)

    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }

    // 同時輸出到 console
    switch (level) {
      case 'error':
        this.originalConsole.error(message, details || '')
        break
      case 'warn':
        this.originalConsole.warn(message, details || '')
        break
      case 'success':
        this.originalConsole.info('✅', message, details || '')
        break
      default:
        this.originalConsole.info(message, details || '')
    }
  }

  // 獲取日誌
  public getLogs(since?: string, limit = 100): LogEntry[] {
    let filteredLogs = [...this.logs]

    if (since) {
      const sinceTime = new Date(since).getTime()
      filteredLogs = this.logs.filter(
        log => new Date(log.timestamp).getTime() > sinceTime
      )
    }

    return filteredLogs.slice(-limit)
  }

  // 清除日誌
  public clear() {
    this.logs.length = 0
  }

  // 獲取日誌總數
  public getTotal(): number {
    return this.logs.length
  }
}

// 創建單例實例
let loggerInstance: RuntimeLogger | null = null

export function getRuntimeLogger(): RuntimeLogger {
  if (!loggerInstance) {
    loggerInstance = new RuntimeLogger()
  }
  return loggerInstance
}

// 導出便捷函數
export function addRuntimeLog(
  level: 'info' | 'warn' | 'error' | 'success',
  message: string,
  details?: string
) {
  const logger = getRuntimeLogger()
  logger.log(level, message, details)
}

