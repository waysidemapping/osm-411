import Ajv from "ajv";
import { readFileSync } from "fs";

const services = JSON.parse(readFileSync('./src/data/services.json'));
const servicesSchema = JSON.parse(readFileSync('./scripts/schemas/services.schema.json'));

const ajv = new Ajv();
const validate = ajv.compile(servicesSchema);
const valid = validate(services);

if (!valid) {
  console.log(validate.errors);
} else {
  console.log('services.json looks okay');
}