import Ajv from 'ajv';
import { resolve } from 'path';
import { bundle } from '@apidevtools/json-schema-ref-parser';

const ajv = new Ajv({ jsonPointers: true });

export default async function loadValidator(name) {
  const schema = await bundle(resolve(`schemas/${name}.yml`));
  return ajv.compile(schema);
}
