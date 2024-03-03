#!/usr/bin/env node

import fs from 'fs';
import { Command } from 'commander';
import Ckron from '../lib/ckron.js';
import CkronError from '../lib/error.js';

const { version } = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url)));
const program = new Command();

function handleError(err) {
  if (err instanceof CkronError) {
    program.error(err.message, { exit: err.exitCode });
  }
  throw err;
}

program
  .name('ckron')
  .option('--config [path]', 'configuration file', '/etc/ckron/config.yml')
  .description('Cron-like job scheduler for docker')
  .version(version);

program
  .command('daemon')
  .description('Run the scheduler daemon')
  .action(async (_, cmd) => {
    const { config } = cmd.optsWithGlobals();
    try {
      const scheduler = new Ckron();
      await scheduler.loadConfig(config);
      scheduler.start();
    } catch (err) {
      handleError(err);
    }
  });

program
  .command('run <job>')
  .description('Run a job')
  .option('--notify', 'send notification on error', false)
  .action(async (_, cmd) => {
    const { config, job, notify } = cmd.optsWithGlobals();
    try {
      const scheduler = new Ckron();
      await scheduler.loadConfig(config);
      await scheduler.runJob(job, notify);
    } catch (err) {
      handleError(err);
    }
  });


program.parse();






