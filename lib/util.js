import yaml from 'js-yaml';
import { resolve } from 'path';
import { split } from 'shlex';
import { parseRepositoryTag as _parseRepositoryTag } from 'dockerode/lib/util.js';
import { promises as fs } from 'fs';
import { Writable } from 'stream';
import { StringDecoder } from 'string_decoder';
import CkronError from './error.js';

export const MAX_OUTPUT_BUFFER_SIZE = 200000; // 200KB

export function parseRepositoryTag(image) {
  return _parseRepositoryTag(image);
}

export function parseCommand(cmd) {
  if (Array.isArray(cmd)) return cmd;
  return split(cmd);
}

export function parseEnvironment(env) {
  if (Array.isArray(env)) {
    return env;
  }
  return Object.entries(env).map(([k, v]) => `${k}${v ? `=${v}` : ''}`);
}

export function parseArgs(args) {
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

export function buildOutputBufferStream() {
  const decoder = new StringDecoder('utf8');
  const res = { buffer: '' };
  res.stream = new Writable({
    write(chunk, encoding, callback) {
      res.buffer += decoder.write(chunk);
      if (res.buffer.length > MAX_OUTPUT_BUFFER_SIZE) {
        const start = res.buffer.length - MAX_OUTPUT_BUFFER_SIZE;
        res.buffer = res.buffer.substring(start);
      }
      callback();
    }
  });

  return res;
}

export async function getFiles(dir) {
  const files = [];
  const dirReads = [];
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    const file = resolve(dir, dirent.name);
    if (dirent.isDirectory()) {
      dirReads.push(getFiles(file));
    } else {
      files.push(file);
    }
  }
  files.concat(...await Promise.all(dirReads));
  return files;
}

export function formatError(err) {
  // Docker error
  if (err.json && err.json.message) {
    return err.json.message.toString();
  }
  if (err.message) {
    return err.message.toString();
  }
  return err.toString();
}

export async function readConfigFile(configFile) {
  try {
    return await fs.readFile(configFile, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new CkronError(`Config file not found: ${configFile}`, 'CONFIG_ENOENT');
    } else if (err.code === 'EACCES') {
      throw new CkronError(`Config file not readable: ${configFile}`, 'CONFIG_EACCES');
    } else if (err.code === 'EISDIR') {
      throw new CkronError(`Config file is a directory: ${configFile}`, 'CONFIG_EISDIR');
    }
    throw err;
  }
}

export function parseYaml(content) {
  try {
    return yaml.load(content);
  } catch (err) {
    throw new CkronError(`Invalid YAML: ${err.message}`, 'CONFIG_SYNTAX');
  }
}
