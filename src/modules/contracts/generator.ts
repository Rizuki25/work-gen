export type GeneratorKind = 'local' | 'template' | 'ai'

export type InputFieldType =
  | 'string'
  | 'integer'
  | 'number'
  | 'boolean'
  | 'enum'
  | 'multiline-text'
  | 'date'
  | 'date-time'
  | 'list'
  | 'object'

export type OutputType = 'plain-text' | 'markdown' | 'json' | 'yaml' | 'csv' | 'html' | 'png'

export type GeneratorInput = Readonly<Record<string, unknown>>

export interface FieldOption {
  readonly value: string
  readonly label: string
}

export interface InputFieldHintVariant {
  readonly placeholder?: string
  readonly helpText?: string
}

export interface InputFieldDefinition {
  readonly id: string
  readonly type: InputFieldType
  readonly label: string
  readonly required?: boolean
  readonly defaultValue?: unknown
  readonly min?: number
  readonly max?: number
  readonly pattern?: string
  readonly placeholder?: string
  readonly helpText?: string
  readonly hintByFieldValue?: {
    readonly fieldId: string
    readonly values: Readonly<Record<string, InputFieldHintVariant>>
  }
  readonly secret?: boolean
  readonly options?: readonly FieldOption[]
}

export interface InputSchema {
  readonly fields: readonly InputFieldDefinition[]
}

export interface GeneratorCapabilities {
  readonly offline: boolean
  readonly copy: boolean
  readonly download: boolean
  readonly network: boolean
  readonly streaming?: boolean
  readonly cancellation?: boolean
}

export interface GeneratorDefinition {
  readonly id: string
  readonly kind: GeneratorKind
  readonly name: string
  readonly description: string
  readonly category: string
  readonly tags: readonly string[]
  readonly icon?: string
  readonly version: string
  readonly inputSchema: InputSchema
  readonly outputTypes: readonly OutputType[]
  readonly capabilities: GeneratorCapabilities
  readonly executorRef: string
  readonly primaryActionLabel?: string
  readonly enabled: boolean
  readonly featured?: boolean
}

export interface ValidationIssue {
  readonly code: string
  readonly message: string
  readonly fieldId?: string
}

export interface ValidationResult {
  readonly valid: boolean
  readonly issues: readonly ValidationIssue[]
}

export interface GeneratorExecutionContext {
  readonly locale: string
  readonly timezone: string
  readonly now: () => Date
  readonly signal?: AbortSignal
}

export interface GeneratorOutput {
  readonly type: OutputType
  readonly mimeType: string
  readonly content: string | Uint8Array
}

export interface GeneratorError {
  readonly code: string
  readonly userMessage: string
  readonly retryable: boolean
  readonly fieldId?: string
  readonly technicalDetails?: string
}

export type GeneratorResult =
  | {
      readonly status: 'success'
      readonly output: GeneratorOutput
    }
  | {
      readonly status: 'failed'
      readonly error: GeneratorError
    }
  | {
      readonly status: 'cancelled'
    }

export interface GeneratorModule {
  readonly definition: GeneratorDefinition
  validate(input: GeneratorInput): ValidationResult
  execute(input: GeneratorInput, context: GeneratorExecutionContext): Promise<GeneratorResult>
  supportedOutputs(): readonly OutputType[]
  dispose?(): void
}
