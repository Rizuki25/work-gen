import { createBuiltInRegistry } from '../registry/create-built-in-registry'
import { jsonFormatterGenerator } from './local/json-formatter-generator'

export function createDefaultRegistry() {
  return createBuiltInRegistry([jsonFormatterGenerator])
}
