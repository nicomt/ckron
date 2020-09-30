const path = require('path');
const test = require('ava');
const util = require('../docker-util');
const MockLog = require('../mock/log');
const RunTask = require('../../lib/tasks/run');

async function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

test('run: simple', async (t) => {
  const log = new MockLog();
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
  const log = new MockLog();
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
  const log = new MockLog();
  const task = new RunTask('test', {
    image: 'busybox',
    volumes: [
      `${path.join(path.resolve(__dirname, '..'), 'fixtures/test')}:/test`
    ],
    command: 'cat /test'
  });

  const { exitCode, output } = await task.execute(log);
  t.is(exitCode, 0);
  t.is(output, 'hello world');
});


test('run: auto remove enabled', async (t) => {
  const log = new MockLog();
  const task = new RunTask('test', {
    image: 'busybox',
    command: 'echo "hello world"',
    auto_remove: true
  });

  const { containerId } = await task.execute(log);
  await sleep(5000);
  t.false(await util.containerExists(containerId), `Container ${containerId} must be deleted when auto_remove is true`);
});

test('run: auto remove disabled', async (t) => {
  const log = new MockLog();
  const task = new RunTask('test', {
    image: 'busybox',
    command: 'echo "hello world"',
    auto_remove: false
  });

  const { containerId } = await task.execute(log);
  await sleep(5000);
  t.true(await util.containerExists(containerId), `Container ${containerId} should not be deleted when auto_remove is false`);
});

// Running all pull test in sequentially to avoid interference with the hello-world image
test('run: pull', async (t) => {
  const log = new MockLog();

  try {
    // #### Pull Missing ####
    await (async () => {
      const task = new RunTask('test', {
        image: 'hello-world',
        pull: 'missing'
      });

      await util.removeImage('hello-world');

      const start1 = Date.now();
      const { exitCode: ec1 } = await task.execute(log);
      t.is(ec1, 0);
      t.true(task.lastPull > start1, 'Image not pulled');

      const start2 = Date.now();
      const { exitCode: ec2 } = await task.execute(log);
      t.is(ec2, 0);
      t.false(task.lastPull > start2, 'Image pulled even-though image exists');
    })();


    // #### Pull Never ####
    await (async () => {
      const task = new RunTask('test', {
        image: 'hello-world',
        pull: 'never'
      });

      await util.removeImage('hello-world');
      try {
        await task.execute(log);
        t.fail('Task should fail if no image available and pull never');
        // eslint-disable-next-line no-empty
      } catch (err) {}

      t.is(task.lastPull, 0);

      await util.pullImage('hello-world');
      const { exitCode } = await task.execute(log);
      t.is(exitCode, 0);
      t.is(task.lastPull, 0);
    })();

    // #### Pull Always ####
    await (async () => {
      const task = new RunTask('test', {
        image: 'hello-world',
        pull: 'always'
      });

      await util.removeImage('hello-world');
      const start1 = Date.now();
      const { exitCode: ec1 } = await task.execute(log);
      t.is(ec1, 0);
      t.true(task.lastPull > start1, 'Image should always be pulled');

      const start2 = Date.now();
      const { exitCode: ec2 } = await task.execute(log);
      t.is(ec2, 0);
      t.true(task.lastPull > start2, 'Image should always be pulled');
    })();

  } finally {
    await util.removeImage('hello-world');
  }

});


