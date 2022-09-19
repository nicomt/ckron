import { resolve } from 'path';
import { split } from 'shlex';
import { parseRepositoryTag as _parseRepositoryTag } from 'dockerode/lib/util.js';
import { promises as fs } from 'fs';
import { Writable } from 'stream';
import { StringDecoder } from 'string_decoder';

export const MAX_OUTPUT_BUFFER_SIZE = 200000; // 200KB

class Util {

  static parseRepositoryTag(image) {
    return _parseRepositoryTag(image);
  }

  static parseCommand(cmd) {
    if (Array.isArray(cmd)) return cmd;
    return split(cmd);
  }

  static parseEnvironment(env) {
    if (Array.isArray(env)) {
      return env;
    }
    return Object.entries(env).map(([k, v]) => `${k}${v ? `=${v}` : ''}`);
  }

  static parseArgs(args) {
    if (Array.isArray(args)) {
      const obj = {};
      for (const arg of args) {
        const [key, value] = arg.split('=');
        obj[key] = value || null;
      }
      return JSON.stringify(obj);
    }
    return JSON.stringify(args);
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

  static async getFiles(dir) {
    const files = [];
    const dirReads = [];
    const dirents = await fs.readdir(dir, { withFileTypes: true });
    for (const dirent of dirents) {
      const file = resolve(dir, dirent.name);
      if (dirent.isDirectory()) {
        dirReads.push(Util.getFiles(file));
      } else {
        files.push(file);
      }
    }
    files.concat(...await Promise.all(dirReads));
    return files;
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

export default Util;
