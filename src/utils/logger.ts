import chalk from 'chalk';

interface LogEntry {
  timestamp: Date;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
  data?: any;
}

export class Logger {
  private logs: LogEntry[] = [];
  private maxLogs: number = 100;

  log(level: 'INFO' | 'WARN' | 'ERROR', message: string, data?: any): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      data
    };

    this.logs.push(entry);
    
    // Mantieni solo gli ultimi maxLogs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log opzionale su console per debug
    if (process.env.DEBUG) {
      this.printLog(entry);
    }
  }

  displayLogs(): void {
    if (this.logs.length === 0) {
      console.log(chalk.gray('📝 Nessun log disponibile'));
      return;
    }

    console.log(chalk.blue('\n📝 Ultimi log:'));
    console.log(chalk.gray('─'.repeat(60)));
    
    this.logs.slice(-10).forEach(log => this.printLog(log));
  }

  private printLog(entry: LogEntry): void {
    const time = entry.timestamp.toLocaleTimeString();
    const levelColor = this.getLevelColor(entry.level);
    
    console.log(
      chalk.gray(`[${time}]`) + 
      ` ${levelColor(entry.level)} ` + 
      chalk.white(entry.message)
    );
    
    if (entry.data) {
      console.log(chalk.gray('  └─'), JSON.stringify(entry.data, null, 2));
    }
  }

  private getLevelColor(level: string): (text: string) => string {
    switch (level) {
      case 'INFO': return chalk.blue;
      case 'WARN': return chalk.yellow;
      case 'ERROR': return chalk.red;
      default: return chalk.white;
    }
  }

  clearLogs(): void {
    this.logs = [];
  }

  exportLogs(): LogEntry[] {
    return [...this.logs];
  }
}
