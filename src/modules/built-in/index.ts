import { createBuiltInRegistry } from '../registry/create-built-in-registry'
import { dummyTextGenerator } from './local/dummy-text-generator'

export function createDefaultRegistry() {
  return createBuiltInRegistry([dummyTextGenerator])
}
