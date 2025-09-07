import test from 'ava';
import MockTask from './mock/tasks/task.js';
import MockFailTask from './mock/tasks/fail-task.js';
import MockNotifier from './mock/notifiers/notifier.js';
import Job from '../lib/job.js';


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

test('job: failure job execution', async (t) => {
  const task1 = new MockFailTask('task1');
  const cleanupTask = new MockTask('cleanup-task');
  const mainJob = new Job('main-job', {
    schedule: '* * * * *',
    tasks: ['task1'],
    on_failure: 'cleanup-job'
  }, { task1 }, {});

  const cleanupJob = new Job('cleanup-job', {
    schedule: '* * * * *',
    tasks: ['cleanup-task']
  }, { 'cleanup-task': cleanupTask }, {});

  // Set up job resolver
  const jobs = { 'main-job': mainJob, 'cleanup-job': cleanupJob };
  const jobResolver = name => jobs[name];
  mainJob.setJobResolver(jobResolver);
  cleanupJob.setJobResolver(jobResolver);

  const success = await mainJob.run();
  t.assert(!success);
  t.is(task1.executionTimes, 1);
  t.is(cleanupTask.executionTimes, 1); // Cleanup job should have run
});

test('job: failure job not found', async (t) => {
  const task1 = new MockFailTask('task1');
  const job = new Job('test-job', {
    schedule: '* * * * *',
    tasks: ['task1'],
    on_failure: 'nonexistent-job'
  }, { task1 }, {});

  job.setJobResolver(() => null); // Returns null for nonexistent job

  const success = await job.run();
  t.assert(!success);
  t.is(task1.executionTimes, 1);
  // Should not crash even if failure job doesn't exist
});


