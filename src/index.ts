import { AuthManager } from '@/utils/auth.js';
import { ConfigManager } from '@/utils/config.js';
import { DirectusAPI } from '@/api/directus.js';
import { Logger } from '@/utils/logger.js';
import boxen from 'boxen';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';

export class DirectusCLI {
  private api: DirectusAPI;
  private logger: Logger;
  private config: ConfigManager;
  private auth: AuthManager;

  constructor() {
    this.api = new DirectusAPI();
    this.logger = new Logger();
    this.config = new ConfigManager();
    this.auth = new AuthManager(this.api, this.logger);
  }

  async start(): Promise<void> {
    console.log(
      boxen(
        chalk.blue.bold('🎯 Directus CLI Tool\n') +
        chalk.gray('Strumento interattivo per API Directus\n') +
        chalk.yellow('✨ Con autenticazione email/password e JWT'),
        {
          padding: 1,
          margin: 1,
          borderStyle: 'round',
          borderColor: 'blue'
        }
      )
    );

    await this.ensureAuthentication();
    await this.showMainMenu();
  }

  private async ensureAuthentication(): Promise<void> {
    const savedConfig = this.config.get();
    
    if (!savedConfig.url || !savedConfig.token) {
      console.log(chalk.yellow('🔐 Autenticazione richiesta'));
      await this.performLogin();
    } else {
      this.api.configure(savedConfig.url, savedConfig.token);
      
      // Verifica se il token è ancora valido
      const isValid = await this.auth.validateToken();
      if (!isValid) {
        console.log(chalk.yellow('🔄 Token scaduto, richiesta nuova autenticazione'));
        await this.performLogin();
      } else {
        console.log(chalk.green('✅ Autenticazione valida'));
      }
    }
  }

  private async performLogin(): Promise<void> {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'url',
        message: 'URL istanza Directus:',
        validate: (input: string) => input.length > 0 || 'URL richiesto'
      },
      {
        type: 'input',
        name: 'email',
        message: 'Email:',
        validate: (input: string) => input.includes('@') || 'Email valida richiesta'
      },
      {
        type: 'password',
        name: 'password',
        message: 'Password:',
        mask: '*',
        validate: (input: string) => input.length > 0 || 'Password richiesta'
      }
    ]);

    const spinner = ora('🔐 Autenticazione in corso...').start();
    
    try {
      const token = await this.auth.login(answers.url, answers.email, answers.password);
      this.config.set({ url: answers.url, token });
      this.api.configure(answers.url, token);
      spinner.succeed('Autenticazione completata con successo');
    } catch (error: any) {
      spinner.fail('Errore durante autenticazione');
      this.logger.log('ERROR', 'Login failed', error);
      console.log(chalk.red(`❌ ${error}`));
      process.exit(1);
    }
  }

  private async showMainMenu(): Promise<void> {
    while (true) {
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'Seleziona un\'azione:',
          choices: [
            { name: '📋 Esporta Schema', value: 'schema' },
            { name: '📊 Lista Collezioni', value: 'collections' },
            { name: '🔍 Query Custom', value: 'query' },
            { name: '👤 Informazioni Utente', value: 'userinfo' },
            { name: '🔄 Riautentica', value: 'reauth' },
            { name: '📝 Visualizza Log', value: 'logs' },
            { name: '🧹 Pulisci Configurazione', value: 'clear' },
            { name: '❌ Esci', value: 'exit' }
          ]
        }
      ]);

      switch (action) {
        case 'schema':
          await this.handleSchemaExport();
          break;
        case 'collections':
          await this.handleCollectionsList();
          break;
        case 'query':
          await this.handleCustomQuery();
          break;
        case 'userinfo':
          await this.handleUserInfo();
          break;
        case 'reauth':
          await this.performLogin();
          break;
        case 'logs':
          this.logger.displayLogs();
          break;
        case 'clear':
          this.config.clear();
          console.log(chalk.green('🧹 Configurazione pulita'));
          break;
        case 'exit':
          console.log(chalk.blue('👋 Arrivederci!'));
          process.exit(0);
      }
    }
  }

  private async handleSchemaExport(): Promise<void> {
    const spinner = ora('📋 Esportazione schema...').start();
    
    try {
      const schema = await this.api.exportSchema();
      spinner.succeed('Schema esportato con successo');
      
      console.log(
        boxen(
          JSON.stringify(schema, null, 2),
          {
            title: 'Schema Directus',
            titleAlignment: 'center',
            padding: 1,
            borderColor: 'green'
          }
        )
      );
      
      this.logger.log('INFO', 'Schema esportato', { collections: Object.keys(schema).length });
    } catch (error: any) {
      spinner.fail('Errore durante esportazione schema');
      this.logger.log('ERROR', 'Errore schema export', error);
      console.log(chalk.red(`❌ ${error}`));
    }
  }

  private async handleCollectionsList(): Promise<void> {
    const spinner = ora('📊 Caricamento collezioni...').start();
    
    try {
      const collections = await this.api.getCollections();
      spinner.succeed('Collezioni caricate');
      
      collections.forEach((collection: any) => {
        console.log(chalk.cyan(`📁 ${collection.collection}`) + 
                   chalk.gray(` (${collection.schema || 'N/A'})`));
      });
      
      this.logger.log('INFO', 'Collezioni listate', { count: collections.length });
    } catch (error: any) {
      spinner.fail('Errore durante caricamento collezioni');
      this.logger.log('ERROR', 'Errore collections', error);
      console.log(chalk.red(`❌ ${error}`));
    }
  }

  private async handleCustomQuery(): Promise<void> {
    const { endpoint } = await inquirer.prompt([
      {
        type: 'input',
        name: 'endpoint',
        message: 'Endpoint (es. /items/your_collection):',
        validate: (input: string) => input.startsWith('/') || 'Deve iniziare con /'
      }
    ]);

    const spinner = ora(`🔍 Query a ${endpoint}...`).start();
    
    try {
      const result = await this.api.customQuery(endpoint);
      spinner.succeed('Query completata');
      
      console.log(
        boxen(
          JSON.stringify(result, null, 2),
          {
            title: `Risultato: ${endpoint}`,
            titleAlignment: 'center',
            padding: 1,
            borderColor: 'yellow'
          }
        )
      );
      
      this.logger.log('INFO', 'Query custom eseguita', { endpoint, resultCount: result?.data?.length || 0 });
    } catch (error: any) {
      spinner.fail('Errore durante query');
      this.logger.log('ERROR', 'Errore custom query', { endpoint, error });
      console.log(chalk.red(`❌ ${error}`));
    }
  }

  private async handleUserInfo(): Promise<void> {
    const spinner = ora('👤 Caricamento informazioni utente...').start();
    
    try {
      const userInfo = await this.api.getCurrentUser();
      spinner.succeed('Informazioni utente caricate');
      
      console.log(
        boxen(
          JSON.stringify(userInfo, null, 2),
          {
            title: 'Informazioni Utente',
            titleAlignment: 'center',
            padding: 1,
            borderColor: 'blue'
          }
        )
      );
      
      this.logger.log('INFO', 'User info retrieved', { userId: userInfo?.id });
    } catch (error: any) {
      spinner.fail('Errore durante caricamento informazioni utente');
      this.logger.log('ERROR', 'Errore user info', error);
      console.log(chalk.red(`❌ ${error}`));
    }
  }

  // Metodi per comandi diretti CLI
  async loginCommand(url?: string, email?: string, password?: string): Promise<void> {
    if (!url || !email || !password) {
      console.log(chalk.red('❌ URL, email e password sono richiesti'));
      process.exit(1);
    }

    const spinner = ora('🔐 Autenticazione...').start();
    
    try {
      const token = await this.auth.login(url, email, password);
      this.config.set({ url, token });
      spinner.succeed('Login completato con successo');
      console.log(chalk.green('✅ Token salvato nella configurazione'));
    } catch (error: any) {
      spinner.fail('Errore durante login');
      console.log(chalk.red(`❌ ${error}`));
      process.exit(1);
    }
  }

  async exportSchema(url?: string, token?: string): Promise<void> {
    if (url && token) {
      this.api.configure(url, token);
    } else {
      const config = this.config.get();
      if (!config.url || !config.token) {
        console.log(chalk.red('❌ Configurazione mancante. Esegui login prima.'));
        process.exit(1);
      }
      this.api.configure(config.url, config.token);
    }
    
    await this.handleSchemaExport();
  }

  async listCollections(): Promise<void> {
    const config = this.config.get();
    if (!config.url || !config.token) {
      console.log(chalk.red('❌ Configurazione mancante. Esegui login prima.'));
      process.exit(1);
    }
    
    this.api.configure(config.url, config.token);
    await this.handleCollectionsList();
  }
}
