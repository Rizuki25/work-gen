import { base64Generator } from './local/base64-generator'
import { createBuiltInRegistry } from '../registry/create-built-in-registry'
import { jsonFormatterGenerator } from './local/json-formatter-generator'
import { passwordGenerator } from './local/password-generator'
import { textCounterGenerator } from './local/text-counter-generator'
import { uuidGenerator } from './local/uuid-generator'

export function createDefaultRegistry() {
  return createBuiltInRegistry([
    base64Generator,
    jsonFormatterGenerator,
    passwordGenerator,
    textCounterGenerator,
    uuidGenerator,
  ])
}
