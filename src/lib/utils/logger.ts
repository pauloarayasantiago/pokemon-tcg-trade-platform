/**
 * Logger utility for consistent logging across the application
 */
export class Logger {
  constructor(private context: string) {}
  
  info(message: string) {
    console.log(`[${this.context}] [INFO] ${message}`);
  }
  
  error(message: string, error?: any) {
    console.error(`[${this.context}] [ERROR] ${message}`, error || '');
  }
  
  warn(message: string) {
    console.warn(`[${this.context}] [WARN] ${message}`);
  }
} 