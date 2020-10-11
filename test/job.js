process.env.CKRON_NOLOG = '1';

const test = require('ava');
const MockTask = require('./mock/tasks/task');
const MockFailTask = require('./mock/tasks/fail-task');
const MockNotifier = require('./mock/notifiers/notifier');
const Job = require('../lib/job');


test('job: simple', async (t) => {
  const task1 = new MockTask('task1');
  const job = new Job('test', {
    schedule: '* * * * *',
    tasks: ['task1']
  }, { task1 }, {});

  const success = await job.run();
  t.assert(success);
  t.is(task1.executionTimes, 1);
});

test('job: failure early stop', async (t) => {
  const task1 = new MockTask('task1');
  const task2 = new MockFailTask('task2');
  const task3 = new MockTask('task3');
  const job = new Job('test', {
    schedule: '* * * * *',
    tasks: ['task1', 'task2', 'task3']
  }, { task1, task2, task3 }, {});

  const success = await job.run();
  t.assert(!success);
  t.is(task1.executionTimes, 1);
  t.is(task2.executionTimes, 1);
  t.is(task3.executionTimes, 0);
});

test('job: failure notifier', async (t) => {
  const task1 = new MockFailTask('task1');
  const notifier1 = new MockNotifier('notifier1');
  const job = new Job('test', {
    schedule: '* * * * *',
    tasks: ['task1'],
    on_error: ['notifier1']
  }, { task1 }, { notifier1 });

  const success = await job.run();
  t.assert(!success);
  t.is(task1.executionTimes, 1);
  t.is(notifier1.notifySubject, 'Job test failed');
  t.is(notifier1.notifyBody, 'expected fail');
});

test('job: strip ansi before notify', async (t) => {
  const task1 = new MockFailTask('task1', '\u001b[31mtest\u001b[39m');
  const notifier1 = new MockNotifier('notifier1');
  const job = new Job('test', {
    schedule: '* * * * *',
    tasks: ['task1'],
    on_error: ['notifier1']
  }, { task1 }, { notifier1 });

  const success = await job.run();
  t.assert(!success);
  t.is(notifier1.notifyBody, 'test');
});



