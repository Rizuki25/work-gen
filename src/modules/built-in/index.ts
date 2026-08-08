import { base64Generator } from './local/base64-generator'
import { createBuiltInRegistry } from '../registry/create-built-in-registry'
import { hashGenerator } from './local/hash-generator'
import { jsonFormatterGenerator } from './local/json-formatter-generator'
import { passwordGenerator } from './local/password-generator'
import { textCounterGenerator } from './local/text-counter-generator'
import { timestampConverterGenerator } from './local/timestamp-generator'
import { uuidGenerator } from './local/uuid-generator'

export function createDefaultRegistry() {
  return createBuiltInRegistry([
    base64Generator,
    hashGenerator,
    jsonFormatterGenerator,
    passwordGenerator,
    textCounterGenerator,
    timestampConverterGenerator,
    uuidGenerator,
  ])
}
