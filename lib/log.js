const chalk = require('chalk');

const colors = ['magenta', 'green', 'yellow', 'cyan', 'blue', 'white', 'red', 'gray'];
class Log {
  constructor() {
    this.namespace = [];
  }

  info(message) {
    console.log(`${this._formatNamespace()}: ${message}`);
  }

  warning(message) {
    console.warn(`${this._formatNamespace()}: ${message}`);
  }

  debug(message) {
    console.log(`${this._formatNamespace()}: ${message}`);
  }

  error(message, err) {
    if (err) message += ` - ${err.toString()}`;
    console.error(`${this._formatNamespace()}: ${message}`);
  }

  _formatNamespace() {
    return this.namespace
      .map((l, i) => chalk[colors[i % 8]](`[${l}]`))
      .join(' ');
  }

  pushNamespace(name) {
    this.namespace.push(name);
  }

  popNamespace() {
    this.namespace.pop();
  }
}

module.exports = Log;
