#!/usr/bin/env node

const commander = require('commander');
const betterAjvErrors = require('better-ajv-errors');
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
      if (err.code === 'CONFIG_SYNTAX') {
        const output = betterAjvErrors(
          err.validationSchema,
          err.validationData,
          [err.validationErrors[0]],
          { indent: 2 }
        );
        process.stderr.write(output, () => {
          process.exit(1);
        });
      } else {
        process.stderr.write(`${err.message || err.toString()}\n`, () => {
          process.exit(1);
        });
      }
    }
  });

program.parse(process.argv);

process.on('SIGINT', () => {
  process.stdout.write('Interrupted\n', () => {
    process.exit(0);
  });
});





