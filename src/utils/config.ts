import { existsSync, readFileSync, writeFileSync } from 'fs';

import { homedir } from 'os';
import { join } from 'path';

interface Config {
  url?: string;
  token?: string;
  email?: string;
}

export class ConfigManager {
  private configPath: string;

  constructor() {
    this.configPath = join(homedir(), '.directus-cli-config.json');
  }

  get(): Config {
    if (!existsSync(this.configPath)) {
      return {};
    }

    try {
      const content = readFileSync(this.configPath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return {};
    }
  }

  set(config: Config): void {
    try {
      const existingConfig = this.get();
      const mergedConfig = { ...existingConfig, ...config };
      writeFileSync(this.configPath, JSON.stringify(mergedConfig, null, 2));
    } catch (error) {
      console.error('Errore salvataggio configurazione:', error);
    }
  }

  clear(): void {
    try {
      if (existsSync(this.configPath)) {
        writeFileSync(this.configPath, '{}');
      }
    } catch (error) {
      console.error('Errore pulizia configurazione:', error);
    }
  }

  getConfigPath(): string {
    return this.configPath;
  }
}
