import { base64Generator } from './local/base64-generator'
import { createBuiltInRegistry } from '../registry/create-built-in-registry'
import { csvJsonGenerator } from './local/csv-json-generator'
import { hashGenerator } from './local/hash-generator'
import { jsonYamlGenerator } from './local/json-yaml-generator'
import { jsonFormatterGenerator } from './local/json-formatter-generator'
import { loremDummyGenerator } from './local/lorem-dummy-generator'
import { passwordGenerator } from './local/password-generator'
import { qrCodeGenerator } from './local/qr-code-generator'
import { regexTesterGenerator } from './local/regex-tester-generator'
import { textCounterGenerator } from './local/text-counter-generator'
import { timestampConverterGenerator } from './local/timestamp-generator'
import { uuidGenerator } from './local/uuid-generator'

export function createDefaultRegistry() {
  return createBuiltInRegistry([
    base64Generator,
    csvJsonGenerator,
    hashGenerator,
    jsonFormatterGenerator,
    jsonYamlGenerator,
    loremDummyGenerator,
    passwordGenerator,
    qrCodeGenerator,
    regexTesterGenerator,
    textCounterGenerator,
    timestampConverterGenerator,
    uuidGenerator,
  ])
}
