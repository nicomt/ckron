import Ajv from 'ajv';
import { resolve } from 'path';
import * as url from 'url';
import { bundle } from '@apidevtools/json-schema-ref-parser';

const ajv = new Ajv({ jsonPointers: true });
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

export default async function loadValidator(name) {
  const schema = await bundle(resolve(__dirname, `schemas/${name}.yml`));
  return ajv.compile(schema);
}
