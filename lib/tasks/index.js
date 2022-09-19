import RunTask from './run.js';
import ExecTask from './exec.js';
import LocalTask from './local.js';
import SignalTask from './signal.js';

export default {
  run: RunTask,
  exec: ExecTask,
  local: LocalTask,
  signal: SignalTask,
};
