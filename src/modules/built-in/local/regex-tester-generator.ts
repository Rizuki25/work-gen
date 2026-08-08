import type {
  GeneratorDefinition,
  GeneratorInput,
  GeneratorModule,
  GeneratorResult,
  ValidationIssue,
  ValidationResult,
} from '../../contracts/generator'

const SUPPORTED_FLAGS = 'gimsuy'

export interface RegexMatch {
  readonly match: string
  readonly index: number
  readonly end: number
  readonly groups: readonly (string | null)[]
  readonly namedGroups: Readonly<Record<string, string | null>>
}

export interface RegexTestResult {
  readonly pattern: string
  readonly flags: string
  readonly matched: boolean
  readonly matchCount: number
  readonly sampleLength: number
  readonly matches: readonly RegexMatch[]
}

const definition: GeneratorDefinition = {
  id: 'local.regex-tester',
  kind: 'local',
  name: 'Regex Tester',
  description: 'Menguji regular expression terhadap sample text dan menampilkan hasil match.',
  category: 'Text & Format',
  tags: ['regex', 'regexp', 'pattern', 'match', 'groups', 'text', 'offline'],
  icon: '.*',
  version: '0.1.0',
  inputSchema: {
    fields: [
      {
        id: 'pattern',
        type: 'string',
        label: 'Pattern',
        required: true,
        placeholder: '\\bWorkGen\\b',
        helpText: 'Masukkan pattern tanpa slash pembungkus, misalnya \\bWorkGen\\b.',
      },
      {
        id: 'sample',
        type: 'multiline-text',
        label: 'Sample text',
        required: false,
        placeholder: 'WorkGen membuat tools lokal. WorkGen tetap sederhana.',
        helpText: 'Match dicari langsung di browser dan sample tidak dikirim ke network.',
      },
      {
        id: 'flags',
        type: 'string',
        label: 'Flags',
        required: false,
        defaultValue: 'g',
        placeholder: 'gim',
        helpText: 'Flag yang didukung: g, i, m, s, u, y. Gunakan g untuk semua match.',
      },
    ],
  },
  outputTypes: ['json'],
  capabilities: {
    offline: true,
    copy: true,
    download: true,
    network: false,
    cancellation: false,
  },
  executorRef: 'built-in.local.regex-tester',
  primaryActionLabel: 'Test pattern',
  enabled: true,
  featured: true,
}

function createIssue(code: string, fieldId: string, message: string): ValidationIssue {
  return { code, fieldId, message }
}

function normalizeFlags(flags: string): string {
  const normalized = flags.trim()
  const unsupportedFlag = Array.from(normalized).find(
    (flag) => !SUPPORTED_FLAGS.includes(flag),
  )

  if (unsupportedFlag) {
    throw new Error(`Flag "${unsupportedFlag}" tidak didukung.`)
  }

  if (new Set(normalized).size !== normalized.length) {
    throw new Error('Flag Regex tidak boleh berulang.')
  }

  return normalized
}

export function createRegex(pattern: string, flags = ''): RegExp {
  return new RegExp(pattern, normalizeFlags(flags))
}

function serializeMatch(match: RegExpExecArray): RegexMatch {
  const namedGroups = Object.fromEntries(
    Object.entries(match.groups ?? {}).map(([name, value]) => [name, value ?? null]),
  )

  return {
    match: match[0],
    index: match.index,
    end: match.index + match[0].length,
    groups: match.slice(1).map((group) => group ?? null),
    namedGroups,
  }
}

export function testRegex(pattern: string, sample: string, flags = ''): RegexTestResult {
  const regex = createRegex(pattern, flags)
  const matches: RegexMatch[] = []

  if (regex.global) {
    let match: RegExpExecArray | null
    while ((match = regex.exec(sample)) !== null) {
      matches.push(serializeMatch(match))

      // RegExp.exec does not always advance lastIndex after a zero-length match.
      // Advance manually so patterns such as `a*` cannot loop forever with `g`.
      if (match[0].length === 0) {
        regex.lastIndex += 1
      }
    }
  } else {
    const match = regex.exec(sample)
    if (match) {
      matches.push(serializeMatch(match))
    }
  }

  return {
    pattern,
    flags: normalizeFlags(flags),
    matched: matches.length > 0,
    matchCount: matches.length,
    sampleLength: sample.length,
    matches,
  }
}

export function formatRegexResult(result: RegexTestResult): string {
  return JSON.stringify(result, null, 2)
}

function validateRegexInput(input: GeneratorInput): ValidationResult {
  if (typeof input.pattern !== 'string' || input.pattern.length === 0) {
    return {
      valid: false,
      issues: [createIssue('required', 'pattern', 'Pattern Regex wajib diisi.')],
    }
  }

  if (input.sample !== undefined && typeof input.sample !== 'string') {
    return {
      valid: false,
      issues: [createIssue('invalid-sample', 'sample', 'Sample text harus berupa teks.')],
    }
  }

  const flags = input.flags === undefined ? '' : input.flags
  if (typeof flags !== 'string') {
    return {
      valid: false,
      issues: [createIssue('invalid-flags', 'flags', 'Flags Regex harus berupa teks.')],
    }
  }

  try {
    normalizeFlags(flags)
  } catch (error) {
    return {
      valid: false,
      issues: [
        createIssue(
          'invalid-flags',
          'flags',
          error instanceof Error ? error.message : 'Flags Regex tidak valid.',
        ),
      ],
    }
  }

  try {
    createRegex(input.pattern, flags)
  } catch (error) {
    return {
      valid: false,
      issues: [
        createIssue(
          'invalid-pattern',
          'pattern',
          error instanceof Error ? error.message : 'Pattern Regex tidak valid.',
        ),
      ],
    }
  }

  return { valid: true, issues: [] }
}

export const regexTesterGenerator: GeneratorModule = {
  definition,

  validate: validateRegexInput,

  async execute(input: GeneratorInput): Promise<GeneratorResult> {
    const validation = validateRegexInput(input)
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

    const pattern = input.pattern as string
    const sample = (input.sample as string | undefined) ?? ''
    const flags = (input.flags as string | undefined) ?? ''

    try {
      const result = testRegex(pattern, sample, flags)
      return {
        status: 'success',
        output: {
          type: 'json',
          mimeType: 'application/json;charset=utf-8',
          content: formatRegexResult(result),
        },
      }
    } catch {
      return {
        status: 'failed',
        error: {
          code: 'regex-test-failed',
          fieldId: 'pattern',
          retryable: false,
          userMessage: 'Regex gagal dijalankan. Periksa pattern dan flags.',
        },
      }
    }
  },

  supportedOutputs() {
    return definition.outputTypes
  },
}
