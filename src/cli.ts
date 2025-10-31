#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { DirectusCLI } from './index.js';

const program = new Command();

program
  .name('directus-cli')
  .description('CLI tool per interagire con Directus API')
  .version('0.1.0');

program
  .command('interactive')
  .alias('i')
  .description('Avvia il menu interattivo')
  .action(async () => {
    console.log(chalk.blue('🚀 Avvio Directus CLI Tool...'));
    const cli = new DirectusCLI();
    await cli.start();
  });

program
  .command('login')
  .description('Effettua login con email e password')
  .option('-e, --email <email>', 'Email utente')
  .option('-p, --password <password>', 'Password utente')
  .option('-u, --url <url>', 'URL istanza Directus')
  .action(async (options) => {
    const cli = new DirectusCLI();
    await cli.loginCommand(options.url, options.email, options.password);
  });

program
  .command('schema')
  .description('Esporta lo schema Directus')
  .option('-u, --url <url>', 'URL istanza Directus')
  .option('-t, --token <token>', 'Bearer token (opzionale se già autenticato)')
  .action(async (options) => {
    const cli = new DirectusCLI();
    await cli.exportSchema(options.url, options.token);
  });

program
  .command('collections')
  .alias('c')
  .description('Lista tutte le collezioni')
  .action(async () => {
    const cli = new DirectusCLI();
    await cli.listCollections();
  });

program.parse();
