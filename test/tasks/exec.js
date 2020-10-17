const test = require('ava');
const dockerUtil = require('../util/docker');
const MockLog = require('../mock/log');
const ExecTask = require('../../lib/tasks/exec');

const log = new MockLog();


async function setup() {
  await dockerUtil.pullImage('busybox');
  const container = await dockerUtil.runContainer({
    Image: 'busybox',
    Cmd: ['tail', '-f', '/dev/null'],
    HostConfig: {
      AutoRemove: true
    }
  });
  return container;
}

test('exec: simple', async (t) => {
  const container = await setup();
  const task = new ExecTask('test', {
    container: container.id,
    command: 'echo "hello world"'
  });

  const { exitCode, output } = await task.execute(log);
  t.is(task.name, 'test');
  t.is(exitCode, 0);
  t.is(output, 'hello world');
  await container.stop();
});

test('exec: environment', async (t) => {
  const container = await setup();
  const task = new ExecTask('test', {
    container: container.id,
    environment: {
      TEST: 'hello world'
    },
    command: 'sh -c "echo $TEST"'
  });

  const { exitCode, output } = await task.execute(log);
  t.is(exitCode, 0);
  t.is(output, 'hello world');
  await container.stop();
});

test('exec: invalid container', async (t) => {
  const task = new ExecTask('test', {
    container: '---',
    command: 'sh -c "echo $TEST"'
  });

  try {
    await task.execute(log);
    t.fail('Should not allow invalid containers');
  } catch (error) {
    t.is(error.reason, 'no such container');
  }
});

test('exec: default workingdir', async (t) => {
  const container = await setup();
  const task = new ExecTask('test', {
    container: container.id,
    command: 'pwd'
  });

  const { exitCode, output } = await task.execute(log);
  t.is(exitCode, 0);
  t.is(output, '/');
  await container.stop();
});

test('exec: custom workingdir', async (t) => {
  const container = await setup();
  const task = new ExecTask('test', {
    container: container.id,
    command: 'pwd',
    working_dir: '/tmp'
  });

  const { exitCode, output } = await task.execute(log);
  t.is(exitCode, 0);
  t.is(output, '/tmp');
  await container.stop();
});