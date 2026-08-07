import type { GeneratorModule } from '../contracts/generator'
import { GeneratorRegistry } from './generator-registry'

export function createBuiltInRegistry(
  modules: readonly GeneratorModule[] = [],
): GeneratorRegistry {
  return new GeneratorRegistry(modules)
}
