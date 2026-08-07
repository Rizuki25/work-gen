import type {
  GeneratorDefinition,
  GeneratorInput,
  GeneratorModule,
  GeneratorResult,
  ValidationResult,
} from '../../contracts/generator'

export interface TextCounts {
  readonly characters: number
  readonly charactersWithoutWhitespace: number
  readonly words: number
  readonly lines: number
}

const definition: GeneratorDefinition = {
  id: 'local.text-counter',
  kind: 'local',
  name: 'Text Counter',
  description: 'Menghitung karakter, kata, dan baris teks secara lokal.',
  category: 'Text & Format',
  tags: ['text', 'counter', 'characters', 'words', 'lines', 'offline'],
  icon: '#',
  version: '0.1.0',
  inputSchema: {
    fields: [
      {
        id: 'text',
        type: 'multiline-text',
        label: 'Teks input',
        required: false,
        placeholder: 'Ketik atau tempel teks yang ingin dihitung...',
        helpText: 'Emoji dihitung sebagai satu karakter; baris kosong tetap dihitung.',
      },
    ],
  },
  outputTypes: ['plain-text'],
  capabilities: {
    offline: true,
    copy: true,
    download: true,
    network: false,
    cancellation: false,
  },
  executorRef: 'built-in.local.text-counter',
  primaryActionLabel: 'Count text',
  enabled: true,
  featured: true,
}

export function countText(text: string): TextCounts {
  const characters = Array.from(text).length
  const charactersWithoutWhitespace = Array.from(text).filter(
    (character) => !/\s/u.test(character),
  ).length
  const trimmedText = text.trim()
  const words = trimmedText.length === 0 ? 0 : trimmedText.split(/\s+/u).length
  const lines = text.length === 0 ? 0 : text.split(/\r\n|\r|\n/).length

  return {
    characters,
    charactersWithoutWhitespace,
    words,
    lines,
  }
}

export function formatTextCounts(counts: TextCounts): string {
  return [
    `Karakter: ${counts.characters}`,
    `Karakter tanpa spasi: ${counts.charactersWithoutWhitespace}`,
    `Kata: ${counts.words}`,
    `Baris: ${counts.lines}`,
  ].join('\n')
}

function validateTextInput(input: GeneratorInput): ValidationResult {
  if (typeof input.text !== 'string') {
    return {
      valid: false,
      issues: [
        {
          code: 'invalid-text',
          fieldId: 'text',
          message: 'Teks input harus berupa teks.',
        },
      ],
    }
  }

  return { valid: true, issues: [] }
}

export const textCounterGenerator: GeneratorModule = {
  definition,

  validate: validateTextInput,

  async execute(input: GeneratorInput): Promise<GeneratorResult> {
    const validation = validateTextInput(input)
    if (!validation.valid) {
      const firstIssue = validation.issues[0]!
      return {
        status: 'failed',
        error: {
          code: firstIssue.code,
          fieldId: firstIssue.fieldId,
          retryable: false,
          userMessage: firstIssue.message,
        },
      }
    }

    const counts = countText(input.text as string)
    return {
      status: 'success',
      output: {
        type: 'plain-text',
        mimeType: 'text/plain;charset=utf-8',
        content: formatTextCounts(counts),
      },
    }
  },

  supportedOutputs() {
    return definition.outputTypes
  },
}
