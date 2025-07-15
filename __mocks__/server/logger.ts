// __mocks__/server/logger.ts
// Mock logger for testing

const noop = () => {};

export const logger = {
  info: noop,
  error: noop,
  debug: noop,
  warn: noop,
  trace: noop,
  fatal: noop,
  logError: noop,
  performance: noop,
  startTimer: () => ({ end: noop }),
  methodEntry: noop,
  methodExit: noop,
  getLogFiles: () => ({
    all: 'test.log',
    error: 'error.log',
    debug: 'debug.log',
    performance: 'performance.log'
  })
};

export default logger;
