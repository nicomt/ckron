const test = require('ava');
const dockerUtil = require('../docker-util');
const MockLog = require('../mock/log');
const SignalTask = require('../../lib/tasks/signal');

const log = new MockLog();


async function setup(signal) {
  const program = `
  let signal = false;
  setTimeout(() => {
    if(!signal) console.log('fail')
  }, 3000);
  process.on('${signal}', () => {
    signal = true;
    console.log('success');
  });`;

  await dockerUtil.pullImage('node:14-alpine');
  const container = await dockerUtil.runContainer({
    Image: 'node:14-alpine',
    Entrypoint: ['node', '-e'],
    Cmd: [program],
    HostConfig: {
      AutoRemove: true
    }
  }, true);
  return container;
}

test('signal: simple', async (t) => {
  const signal = 'SIGHUP';
  const container = await setup(signal);
  const task = new SignalTask('test', {
    container: container.id,
    signal
  });

  await task.execute(log);
  const output = await container.output;
  t.is(task.name, 'test');
  t.is(output, 'success');
});
