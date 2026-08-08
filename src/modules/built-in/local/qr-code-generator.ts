import * as QRCode from 'qrcode'
import type {
  GeneratorDefinition,
  GeneratorInput,
  GeneratorModule,
  GeneratorResult,
  ValidationIssue,
  ValidationResult,
} from '../../contracts/generator'

const ERROR_CORRECTION_LEVELS = ['low', 'medium', 'quartile', 'high'] as const
type ErrorCorrectionLevel = (typeof ERROR_CORRECTION_LEVELS)[number]

const MIN_SIZE = 128
const MAX_SIZE = 1024

const definition: GeneratorDefinition = {
  id: 'local.qr-code',
  kind: 'local',
  name: 'QR Code Generator',
  description: 'Membuat QR Code PNG dari teks atau URL secara lokal.',
  category: 'Data & Conversion',
  tags: ['qr', 'qrcode', 'barcode', 'url', 'png', 'offline'],
  icon: 'QR',
  version: '0.1.0',
  inputSchema: {
    fields: [
      {
        id: 'text',
        type: 'multiline-text',
        label: 'Teks atau URL',
        required: true,
        placeholder: 'https://workgen.local atau teks lain',
        helpText: 'Data di-encode langsung di browser dan tidak dikirim ke network.',
      },
      {
        id: 'size',
        type: 'integer',
        label: 'Ukuran PNG (px)',
        required: true,
        defaultValue: 256,
        min: MIN_SIZE,
        max: MAX_SIZE,
        helpText: `Ukuran gambar antara ${MIN_SIZE} dan ${MAX_SIZE} px.`,
      },
      {
        id: 'errorCorrection',
        type: 'enum',
        label: 'Error correction',
        required: true,
        defaultValue: 'medium',
        options: [
          { value: 'low', label: 'Low (L)' },
          { value: 'medium', label: 'Medium (M)' },
          { value: 'quartile', label: 'Quartile (Q)' },
          { value: 'high', label: 'High (H)' },
        ],
        helpText: 'Level lebih tinggi lebih tahan rusak, tetapi membutuhkan QR lebih padat.',
      },
    ],
  },
  outputTypes: ['png'],
  capabilities: {
    offline: true,
    copy: false,
    download: true,
    network: false,
    cancellation: false,
  },
  executorRef: 'built-in.local.qr-code',
  primaryActionLabel: 'Generate QR Code',
  enabled: true,
  featured: true,
}

function createIssue(code: string, fieldId: string, message: string): ValidationIssue {
  return { code, fieldId, message }
}

export async function generateQrCode(
  text: string,
  size: number,
  errorCorrection: ErrorCorrectionLevel,
): Promise<string> {
  return QRCode.toDataURL(text, {
    type: 'image/png',
    width: size,
    margin: 4,
    errorCorrectionLevel: errorCorrection,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  })
}

function validateQrCodeInput(input: GeneratorInput): ValidationResult {
  if (typeof input.text !== 'string' || input.text.trim().length === 0) {
    return {
      valid: false,
      issues: [createIssue('required', 'text', 'Teks atau URL wajib diisi.')],
    }
  }

  const size = input.size
  if (typeof size !== 'number' || !Number.isInteger(size)) {
    return {
      valid: false,
      issues: [createIssue('invalid-size', 'size', 'Ukuran harus berupa bilangan bulat.')],
    }
  }

  if (size < MIN_SIZE || size > MAX_SIZE) {
    return {
      valid: false,
      issues: [
        createIssue(
          'size-out-of-range',
          'size',
          `Ukuran harus berada di antara ${MIN_SIZE} dan ${MAX_SIZE} px.`,
        ),
      ],
    }
  }

  if (
    typeof input.errorCorrection !== 'string' ||
    !ERROR_CORRECTION_LEVELS.includes(input.errorCorrection as ErrorCorrectionLevel)
  ) {
    return {
      valid: false,
      issues: [
        createIssue(
          'invalid-error-correction',
          'errorCorrection',
          'Pilih level error correction yang tersedia.',
        ),
      ],
    }
  }

  return { valid: true, issues: [] }
}

export const qrCodeGenerator: GeneratorModule = {
  definition,

  validate: validateQrCodeInput,

  async execute(input: GeneratorInput): Promise<GeneratorResult> {
    const validation = validateQrCodeInput(input)
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

    try {
      const content = await generateQrCode(
        input.text as string,
        input.size as number,
        input.errorCorrection as ErrorCorrectionLevel,
      )

      return {
        status: 'success',
        output: {
          type: 'png',
          mimeType: 'image/png',
          content,
        },
      }
    } catch {
      return {
        status: 'failed',
        error: {
          code: 'qr-generation-failed',
          fieldId: 'text',
          retryable: false,
          userMessage: 'QR Code tidak dapat dibuat. Kurangi panjang teks atau coba lagi.',
        },
      }
    }
  },

  supportedOutputs() {
    return definition.outputTypes
  },
}
