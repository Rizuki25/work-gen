import { createBuiltInRegistry } from '../registry/create-built-in-registry'
import { jsonFormatterGenerator } from './local/json-formatter-generator'
import { textCounterGenerator } from './local/text-counter-generator'
import { uuidGenerator } from './local/uuid-generator'

export function createDefaultRegistry() {
  return createBuiltInRegistry([jsonFormatterGenerator, textCounterGenerator, uuidGenerator])
}
