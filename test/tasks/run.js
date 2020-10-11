const path = require('path');
const test = require('ava');
const dockerUtil = require('../util/docker');
const MockLog = require('../mock/log');
const RunTask = require('../../lib/tasks/run');

const log = new MockLog();

async function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

test('run: simple', async (t) => {
  const task = new RunTask('test', {
    image: 'busybox',
    command: 'echo "hello world"'
  });

  const { exitCode, output } = await task.execute(log);
  t.is(task.name, 'test');
  t.is(exitCode, 0);
  t.is(output, 'hello world');
});


test('run: environment', async (t) => {
  const task = new RunTask('test', {
    image: 'busybox',
    environment: {
      TEST: 'hello world'
    },
    command: 'sh -c "echo $TEST"'
  });

  const { exitCode, output } = await task.execute(log);
  t.is(exitCode, 0);
  t.is(output, 'hello world');
});


test('run: mount', async (t) => {
  const task = new RunTask('test', {
    image: 'busybox',
    volumes: [
      `${path.join(path.resolve(__dirname, '..'), 'fixtures/test1')}:/test`
    ],
    command: 'cat /test'
  });

  const { exitCode, output } = await task.execute(log);
  t.is(exitCode, 0);
  t.is(output, 'test1');
});


test('run: auto remove enabled', async (t) => {
  const task = new RunTask('test', {
    image: 'busybox',
    command: 'echo "hello world"',
    auto_remove: true
  });

  const { containerId } = await task.execute(log);
  await sleep(5000);
  t.false(await dockerUtil.containerExists(containerId), `Container ${containerId} must be deleted when auto_remove is true`);
});


test('run: auto remove disabled', async (t) => {
  const task = new RunTask('test', {
    image: 'busybox',
    command: 'echo "hello world"',
    auto_remove: false
  });

  const { containerId } = await task.execute(log);
  await sleep(5000);
  t.true(await dockerUtil.containerExists(containerId), `Container ${containerId} should not be deleted when auto_remove is false`);
});


test('run: pull missing', async (t) => {
  const task = new RunTask('test', {
    image: 'nicomt/test:test1',
    command: 'echo test',
    pull: 'missing'
  });

  await dockerUtil.removeImage('nicomt/test:test1');

  const start1 = Date.now();
  const { exitCode: ec1 } = await task.execute(log);
  t.is(ec1, 0);
  t.true(task.lastPull > start1, 'Image not pulled');

  const start2 = Date.now();
  const { exitCode: ec2 } = await task.execute(log);
  t.is(ec2, 0);
  t.false(task.lastPull > start2, 'Image pulled even-though image exists');
});


test('run: pull never', async (t) => {
  const task = new RunTask('test', {
    image: 'nicomt/test:test2',
    command: 'echo test',
    pull: 'never'
  });

  await dockerUtil.removeImage('nicomt/test:test2');
  try {
    await task.execute(log);
    t.fail('Task should fail if no image available and pull never');
    // eslint-disable-next-line no-empty
  } catch (err) {}

  t.is(task.lastPull, 0);

  await dockerUtil.pullImage('nicomt/test:test2');
  const { exitCode } = await task.execute(log);
  t.is(exitCode, 0);
  t.is(task.lastPull, 0);
});

test('run: pull', async (t) => {
  const task = new RunTask('test', {
    image: 'nicomt/test:test3',
    command: 'echo test',
    pull: 'always'
  });

  await dockerUtil.removeImage('nicomt/test:test3');
  const start1 = Date.now();
  const { exitCode: ec1 } = await task.execute(log);
  t.is(ec1, 0);
  t.true(task.lastPull > start1, 'Image should always be pulled');

  const start2 = Date.now();
  const { exitCode: ec2 } = await task.execute(log);
  t.is(ec2, 0);
  t.true(task.lastPull > start2, 'Image should always be pulled');
});


