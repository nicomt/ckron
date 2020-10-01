#!/usr/bin/env node

const commander = require('commander');
const Ckron = require('../lib/ckron');
const { version } = require('../package.json');

const program = new commander.Command();

program
  .version(version)
  .command('daemon')
  .option('--config <path>', 'configuration file', '/etc/ckron/config.yml')
  .action(async (cmd) => {
    try {
      const scheduler = new Ckron();
      await scheduler.loadConfig(cmd.config);
      scheduler.start();
    } catch (err) {
      console.error(err.message || err);
      process.exitCode = 1;
    }
  });

program.parse(process.argv);

process.on('SIGINT', () => {
  console.info('Interrupted');
  process.exit(0);
});





