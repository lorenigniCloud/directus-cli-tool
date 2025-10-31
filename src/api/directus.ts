import axios, { AxiosInstance, AxiosResponse } from 'axios';

import { Logger } from '@/utils/logger.js';

export class DirectusAPI {
  private client: AxiosInstance | null = null;
  private logger: Logger;
  private baseUrl: string = '';
  private token: string = '';

  constructor() {
    this.logger = new Logger();
  }

  configure(baseUrl: string, token: string): void {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // rimuovi trailing slash
    this.token = token;
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    // Request interceptor per logging
    this.client.interceptors.request.use(
      (config) => {
        this.logger.log('INFO', 'API Request', {
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL
        });
        return config;
      },
      (error) => {
        this.logger.log('ERROR', 'Request Error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor per logging
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        this.logger.log('INFO', 'API Response', {
          status: response.status,
          url: response.config.url,
          dataSize: JSON.stringify(response.data).length
        });
        return response;
      },
      (error) => {
        this.logger.log('ERROR', 'Response Error', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  async login(baseUrl: string, email: string, password: string): Promise<string> {
    const loginClient = axios.create({
      baseURL: baseUrl.replace(/\/$/, ''),
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    try {
      // TODO: Sostituire con l'endpoint corretto quando disponibile
      const response = await loginClient.post('/auth/login', {
        email,
        password
      });

      // Assumi che la risposta contenga il token in response.data.data.access_token
      // Adattare in base alla struttura reale della risposta di Directus
      const token = response.data?.data?.access_token || response.data?.access_token;
      
      if (!token) {
        throw new Error('Token non ricevuto dalla risposta di login');
      }

      this.logger.log('INFO', 'Login successful', { email });
      return token;
    } catch (error: any) {
      this.logger.log('ERROR', 'Login failed', { email, error: error.message });
      throw new Error(`Login fallito: ${error.response?.data?.errors?.[0]?.message || error.message}`);
    }
  }

  async validateToken(): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      // Prova a fare una chiamata semplice per validare il token
      await this.client.get('/users/me');
      return true;
    } catch {
      return false;
    }
  }

  async getCurrentUser(): Promise<any> {
    if (!this.client) {
      throw new Error('Client non configurato. Esegui configure() prima.');
    }

    const response = await this.client.get('/users/me');
    return response.data.data;
  }

  async exportSchema(): Promise<any> {
    if (!this.client) {
      throw new Error('Client non configurato. Esegui configure() prima.');
    }

    const response = await this.client.get('/schema/snapshot?export=json');
    return response.data;
  }

  async getCollections(): Promise<any[]> {
    if (!this.client) {
      throw new Error('Client non configurato. Esegui configure() prima.');
    }

    const response = await this.client.get('/collections');
    return response.data.data || [];
  }

  async customQuery(endpoint: string): Promise<any> {
    if (!this.client) {
      throw new Error('Client non configurato. Esegui configure() prima.');
    }

    const response = await this.client.get(endpoint);
    return response.data;
  }

  async getItems(collection: string, params?: Record<string, any>): Promise<any> {
    if (!this.client) {
      throw new Error('Client non configurato. Esegui configure() prima.');
    }

    const response = await this.client.get(`/items/${collection}`, { params });
    return response.data;
  }
}
