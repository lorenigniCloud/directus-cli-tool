import { DirectusAPI } from '../api/directus.js';
import { Logger } from './logger.js';

export class AuthManager {
  private api: DirectusAPI;
  private logger: Logger;

  constructor(api: DirectusAPI, logger: Logger) {
    this.api = api;
    this.logger = logger;
  }

  async login(url: string, email: string, password: string): Promise<string> {
    this.logger.log('INFO', 'Attempting login', { url, email });
    
    try {
      const token = await this.api.login(url, email, password);
      this.logger.log('INFO', 'Login successful', { email });
      return token;
    } catch (error: any) {
      this.logger.log('ERROR', 'Login failed', { email, error: error.message });
      throw error;
    }
  }

  async validateToken(): Promise<boolean> {
    try {
      const isValid = await this.api.validateToken();
      this.logger.log('INFO', 'Token validation', { isValid });
      return isValid;
    } catch (error: any) {
      this.logger.log('ERROR', 'Token validation failed', { error: error.message });
      return false;
    }
  }

  async refreshToken(url: string, refreshToken: string): Promise<string> {
    // TODO: Implementare quando sarà disponibile l'endpoint di refresh
    // Per ora ritorna errore
    throw new Error('Refresh token non ancora implementato');
  }
}
