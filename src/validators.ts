import schema from './schema.json' with { type: "json" };

import Ajv from "ajv"

const ajv = new Ajv()

ajv.addSchema(schema);

const _message = ajv.getSchema('#/definitions/Message');
if (!_message) throw new Error('message validator is not defined');

export default {
  message:_message
}