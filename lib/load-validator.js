import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { resolve } from 'path';
import * as url from 'url';
import RefParser from '@apidevtools/json-schema-ref-parser';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
const ajv = new Ajv();
addFormats(ajv);

export default async function loadValidator(name) {
  const schema = await RefParser.bundle(resolve(__dirname, `schemas/${name}.yml`));
  return ajv.compile(schema);
}
