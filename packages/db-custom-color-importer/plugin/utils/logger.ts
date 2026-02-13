/**
 * Logger utility for consistent logging across the plugin
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private level: LogLevel = LogLevel.INFO;
  private prefix: string = "[DB Custom Color Importer]";

  /**
   * Set the minimum log level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Set a custom prefix for all log messages
   */
  setPrefix(prefix: string): void {
    this.prefix = prefix;
  }

  /**
   * Format a log message with timestamp and prefix
   */
  private format(level: string, message: string, context?: string): string {
    const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
    const contextStr = context ? ` [${context}]` : "";
    return `${this.prefix}${contextStr} [${level}] ${timestamp} - ${message}`;
  }

  /**
   * Log a debug message (lowest priority)
   */
  debug(message: string, context?: string): void {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(this.format("DEBUG", message, context));
    }
  }

  /**
   * Log an info message
   */
  info(message: string, context?: string): void {
    if (this.level <= LogLevel.INFO) {
      console.log(this.format("INFO", message, context));
    }
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: string): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(this.format("WARN", message, context));
    }
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error | unknown, context?: string): void {
    if (this.level <= LogLevel.ERROR) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const fullMessage = error ? `${message}: ${errorMsg}` : message;
      console.error(this.format("ERROR", fullMessage, context));

      // Log stack trace for errors if available
      if (error instanceof Error && error.stack) {
        console.error(error.stack);
      }
    }
  }

  /**
   * Log a section header (for better visual separation)
   */
  section(title: string): void {
    if (this.level <= LogLevel.INFO) {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`${this.prefix} ${title}`);
      console.log(`${"=".repeat(60)}`);
    }
  }

  /**
   * Log a subsection header
   */
  subsection(title: string): void {
    if (this.level <= LogLevel.INFO) {
      console.log(`\n${"-".repeat(40)}`);
      console.log(`  ${title}`);
      console.log(`${"-".repeat(40)}`);
    }
  }

  /**
   * Log a success message
   */
  success(message: string, context?: string): void {
    if (this.level <= LogLevel.INFO) {
      console.log(this.format("✓ SUCCESS", message, context));
    }
  }

  /**
   * Log progress with a step indicator
   */
  step(step: number, total: number, message: string): void {
    if (this.level <= LogLevel.INFO) {
      console.log(this.format("INFO", `[${step}/${total}] ${message}`));
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions
export const log = {
  debug: (msg: string, ctx?: string) => logger.debug(msg, ctx),
  info: (msg: string, ctx?: string) => logger.info(msg, ctx),
  warn: (msg: string, ctx?: string) => logger.warn(msg, ctx),
  error: (msg: string, err?: Error | unknown, ctx?: string) =>
    logger.error(msg, err, ctx),
  section: (title: string) => logger.section(title),
  subsection: (title: string) => logger.subsection(title),
  success: (msg: string, ctx?: string) => logger.success(msg, ctx),
  step: (step: number, total: number, msg: string) =>
    logger.step(step, total, msg),
  setLevel: (level: LogLevel) => logger.setLevel(level),
};
