const shlex = require('shlex');
const dockerUtil = require('dockerode/lib/util');
const { Writable } = require('stream');
const { StringDecoder } = require('string_decoder');

const MAX_OUTPUT_BUFFER_SIZE = 200000; // 200KB

class Util {

  static parseRepositoryTag(image) {
    return dockerUtil.parseRepositoryTag(image);
  }

  static parseCommand(cmd) {
    if (Array.isArray(cmd)) return cmd;
    return shlex.split(cmd);
  }

  static parseEnvironment(env) {
    if (Array.isArray(env)) {
      return env;
    }
    return Object.entries(env).map(([k, v]) => `${k}${v ? `=${v}` : ''}`);
  }

  static buildOutputBufferStream() {
    const decoder = new StringDecoder('utf8');
    const res = { buffer: '' };
    res.stream = new Writable({
      write(chunk, encoding, callback) {
        res.buffer += decoder.write(chunk);
        if (res.buffer.length > Util.MAX_OUTPUT_BUFFER_SIZE) {
          const start = res.buffer.length - Util.MAX_OUTPUT_BUFFER_SIZE;
          res.buffer = res.buffer.substring(start);
        }
        callback();
      }
    });

    return res;
  }

  static formatError(err) {
    // Docker error
    if (err.json && err.json.message) {
      return err.json.message.toString();
    }
    if (err.message) {
      return err.message.toString();
    }
    return err.toString();
  }

}

Util.MAX_OUTPUT_BUFFER_SIZE = MAX_OUTPUT_BUFFER_SIZE;

module.exports = Util;
