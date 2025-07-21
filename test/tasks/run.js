import { join, resolve } from 'path';
import test from 'ava';
import * as url from 'url';
import DockerUtil from '../util/docker.js';
import MockLog from '../mock/log.js';
import { MAX_OUTPUT_BUFFER_SIZE } from '../../lib/util.js';
import RunTask from '../../lib/tasks/run.js';

const log = new MockLog();
const dockerUtil = new DockerUtil();
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

async function sleep(ms) {
  return new Promise((res) => { setTimeout(res, ms); });
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

test('run: entrypoint', async (t) => {
  const task = new RunTask('test', {
    image: 'busybox',
    entrypoint: 'echo',
    command: '"hello world"'
  });

  const { exitCode, output } = await task.execute(log);
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
      `${join(resolve(__dirname, '..'), 'fixtures/test1')}:/test`
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

test('run: build', async (t) => {
  const task = new RunTask('test', {
    image: 'nicomt/test:local',
    build: resolve(__dirname, '../fixtures'),
    command: 'cat /test1'
  });

  await dockerUtil.removeImage('nicomt/test:local', { force: true });
  const start = Date.now();
  const { exitCode, output } = await task.execute(log);
  t.is(exitCode, 0);
  t.is(output, 'test1');
  t.true(task.lastBuild > start, 'Image not built');

  const { lastBuild } = task;

  const task2 = new RunTask('test2', {
    image: 'nicomt/test:local',
    build: resolve(__dirname, '../fixtures'),
    command: 'cat /test1',
    update: 'missing'
  });

  await task2.execute(log);
  t.true(task2.lastBuild !== lastBuild, 'Image should not be built if already exists');

  const task3 = new RunTask('test3', {
    image: 'nicomt/test:local',
    build: resolve(__dirname, '../fixtures'),
    command: 'cat /test1',
    update: 'always'
  });

  await task3.execute(log);
  t.true(task3.lastBuild > lastBuild, 'Image should always be built');

  try {
    const task4 = new RunTask('test4', {
      image: 'nicomt/test:local',
      build: resolve(__dirname, '../fixtures'),
      command: 'cat /test4',
      update: 'missing'
    });
    await task4.execute(log);
    t.fail('Task should fail if accessing an ignored file');
    // eslint-disable-next-line no-empty
  } catch (error) {}

});

test('run: build dockerfile', async (t) => {
  const task = new RunTask('test', {
    image: 'nicomt/test:local1',
    build: {
      context: resolve(__dirname, '../fixtures'),
      dockerfile: 'Dockerfile.1'
    },
    command: 'cat /test'
  });

  await dockerUtil.removeImage('nicomt/test:local1', { force: true });
  const { exitCode, output } = await task.execute(log);
  t.is(exitCode, 0);
  t.is(output, 'test1');

  const task2 = new RunTask('test2', {
    image: 'nicomt/test:local2',
    build: {
      context: resolve(__dirname, '../fixtures'),
      dockerfile: 'Dockerfile.2'
    },
    command: 'cat /test'
  });

  await dockerUtil.removeImage('nicomt/test:local2');
  const res2 = await task2.execute(log);
  t.is(res2.exitCode, 0);
  t.is(res2.output, 'test2');

  const task3 = new RunTask('test3', {
    image: 'nicomt/test:local3',
    build: {
      context: resolve(__dirname, '../fixtures'),
      dockerfile: 'Dockerfile.3'
    },
    command: 'cat /test'
  });

  await dockerUtil.removeImage('nicomt/test:local3');
  const res3 = await task3.execute(log);
  t.is(res3.exitCode, 0);
  t.is(res3.output, 'test3');
});

test('run: build args', async (t) => {
  const task = new RunTask('test', {
    image: 'nicomt/test:localarg',
    build: {
      context: resolve(__dirname, '../fixtures'),
      args: {
        argtest: 'argtest1'
      }
    },
    command: 'cat /argtest'
  });
  await dockerUtil.removeImage('nicomt/test:localarg');
  const { exitCode, output } = await task.execute(log);
  t.is(exitCode, 0);
  t.is(output, 'argtest1');

  const task2 = new RunTask('test2', {
    image: 'nicomt/test:localarg2',
    build: {
      context: resolve(__dirname, '../fixtures'),
      args: [
        'argtest=argtest2'
      ]
    },
    command: 'cat /argtest'
  });
  await dockerUtil.removeImage('nicomt/test:localarg2');
  const { exitCode: ec2, output: out2 } = await task2.execute(log);
  t.is(ec2, 0);
  t.is(out2, 'argtest2');
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

  await dockerUtil.removeImage('nicomt/test:test2', { force: true });
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

  await dockerUtil.removeImage('nicomt/test:test3', { force: true });
  const start1 = Date.now();
  const { exitCode: ec1 } = await task.execute(log);
  t.is(ec1, 0);
  t.true(task.lastPull > start1, 'Image should always be pulled');

  const start2 = Date.now();
  const { exitCode: ec2 } = await task.execute(log);
  t.is(ec2, 0);
  t.true(task.lastPull > start2, 'Image should always be pulled');
});

test('run: default user', async (t) => {
  const task = new RunTask('test', {
    image: 'busybox',
    command: 'whoami'
  });

  const { exitCode, output } = await task.execute(log);
  t.is(exitCode, 0);
  t.is(output, 'root');
});

test('run: custom user', async (t) => {
  const task = new RunTask('test', {
    image: 'busybox',
    command: 'whoami',
    user: 'nobody'
  });

  const { exitCode, output } = await task.execute(log);
  t.is(exitCode, 0);
  t.is(output, 'nobody');
});

test('run: nonexistent user', async (t) => {
  const task = new RunTask('test', {
    image: 'busybox',
    command: 'whoami',
    user: 'notauser'
  });

  try {
    await task.execute(log);
    t.fail('Task should fail if user exists');
    // eslint-disable-next-line no-empty
  } catch (err) {}

  t.pass();
});

test('run: default workingdir', async (t) => {
  const task = new RunTask('test', {
    image: 'busybox',
    command: 'pwd'
  });

  const { exitCode, output } = await task.execute(log);
  t.is(exitCode, 0);
  t.is(output, '/');
});

test('run: custom workingdir', async (t) => {
  const task = new RunTask('test', {
    image: 'busybox',
    command: 'pwd',
    working_dir: '/tmp'
  });

  const { exitCode, output } = await task.execute(log);
  t.is(exitCode, 0);
  t.is(output, '/tmp');
});

test('run: very long output', async (t) => {
  const task = new RunTask('test', {
    image: 'busybox',
    command: 'sh -c "yes 0123456789 | head -1000000"'
  });

  const { exitCode, output } = await task.execute(log);
  t.is(task.name, 'test');
  t.is(exitCode, 0);
  t.true(output.length <= MAX_OUTPUT_BUFFER_SIZE);
});

test('run: networks', async (t) => {
  const net1 = await dockerUtil.docker.createNetwork({ Name: 'ckron_test_net1' });
  const net2 = await dockerUtil.docker.createNetwork({ Name: 'ckron_test_net2' });
  const task = new RunTask('test', {
    image: 'busybox',
    command: 'echo net',
    networks: ['ckron_test_net1', 'ckron_test_net2'],
    auto_remove: false
  });

  const { exitCode, containerId } = await task.execute(log);
  t.is(exitCode, 0);
  const container = dockerUtil.docker.getContainer(containerId);
  const inspect = await container.inspect();
  t.truthy(inspect.NetworkSettings.Networks['ckron_test_net1']);
  t.truthy(inspect.NetworkSettings.Networks['ckron_test_net2']);
  await container.remove();
  await net1.remove();
  await net2.remove();
});

test('run: networks must be array', async (t) => {
  try {
    // eslint-disable-next-line no-new
    new RunTask('test', { image: 'busybox', networks: 'net' });
    t.fail('Should not allow networks as string');
  } catch (err) {
    t.pass();
  }
});

test('run: networks array must not be empty', async (t) => {
  try {
    // eslint-disable-next-line no-new
    new RunTask('test', { image: 'busybox', networks: [] });
    t.fail('Should not allow empty networks array');
  } catch (err) {
    t.pass();
  }
});

test('run: networks array must contain only strings', async (t) => {
  try {
    // eslint-disable-next-line no-new
    new RunTask('test', { image: 'busybox', networks: [123] });
    t.fail('Should not allow non string network names');
  } catch (err) {
    t.pass();
  }
});
