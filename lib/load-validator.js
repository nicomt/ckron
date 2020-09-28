const Ajv = require('ajv');
const refParser = require('@apidevtools/json-schema-ref-parser');

const ajv = new Ajv({ jsonPointers: true });

module.exports = async function loadValidator(name) {
  const schema = await refParser.bundle(`${__dirname}/schemas/${name}.yml`);
  return ajv.compile(schema);
};
