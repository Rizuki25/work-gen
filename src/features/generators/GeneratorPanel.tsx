import {
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from 'react'
import type {
  GeneratorInput,
  GeneratorModule,
  InputFieldDefinition,
  OutputType,
  ValidationIssue,
} from '../../modules/contracts'
import { resolveFieldHint } from './field-hints'

interface GeneratorPanelProps {
  readonly generator: GeneratorModule
}

type RunStatus = 'idle' | 'running' | 'success'

function outputExtension(outputType: OutputType | undefined): string {
  switch (outputType) {
    case 'json':
      return 'json'
    case 'yaml':
      return 'yaml'
    case 'markdown':
      return 'md'
    case 'csv':
      return 'csv'
    case 'html':
      return 'html'
    case 'png':
      return 'png'
    default:
      return 'txt'
  }
}

function initialInputValues(
  fields: readonly InputFieldDefinition[],
): Record<string, string> {
  return Object.fromEntries(
    fields.map((field) => {
      if (field.defaultValue !== undefined) {
        return [field.id, String(field.defaultValue)]
      }

      if (field.type === 'boolean') {
        return [field.id, 'false']
      }

      if (field.type === 'enum') {
        return [field.id, field.options?.[0]?.value ?? '']
      }

      return [field.id, '']
    }),
  )
}

function parseFieldValue(field: InputFieldDefinition, rawValue: string): unknown {
  switch (field.type) {
    case 'integer':
      return rawValue.trim() === '' ? undefined : Number(rawValue)
    case 'number':
      return rawValue.trim() === '' ? undefined : Number(rawValue)
    case 'boolean':
      return rawValue === 'true'
    default:
      return rawValue
  }
}

function dataUrlToBlob(dataUrl: string, fallbackMimeType: string): Blob | undefined {
  const separatorIndex = dataUrl.indexOf(',')
  if (separatorIndex < 0) {
    return undefined
  }

  const metadata = dataUrl.slice(0, separatorIndex)
  const encodedContent = dataUrl.slice(separatorIndex + 1)
  if (!metadata.includes(';base64')) {
    return undefined
  }

  const binaryContent = globalThis.atob(encodedContent)
  const bytes = Uint8Array.from(binaryContent, (character) => character.charCodeAt(0))
  const mimeType = metadata.match(/^data:([^;]+)/)?.[1] ?? fallbackMimeType

  return new Blob([bytes], { type: mimeType })
}

export function GeneratorPanel({ generator }: GeneratorPanelProps) {
  const inputFields = generator.definition.inputSchema.fields
  const [inputValues, setInputValues] = useState<Record<string, string>>(() =>
    initialInputValues(inputFields),
  )
  const [outputText, setOutputText] = useState<string | undefined>()
  const [outputType, setOutputType] = useState<OutputType | undefined>()
  const [outputMimeType, setOutputMimeType] = useState<string | undefined>()
  const [issue, setIssue] = useState<ValidationIssue | undefined>()
  const [runStatus, setRunStatus] = useState<RunStatus>('idle')
  const [actionMessage, setActionMessage] = useState<string | undefined>()

  if (inputFields.length === 0) {
    return (
      <section className="demo-section" aria-labelledby="generator-error-title">
        <p className="section-kicker">Generator error</p>
        <h2 id="generator-error-title">Input schema tidak tersedia</h2>
        <p className="section-description">
          Generator ini belum mendeklarasikan field input yang dapat ditampilkan.
        </p>
      </section>
    )
  }

  function handleFieldChange(
    field: InputFieldDefinition,
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const value = field.type === 'boolean'
      ? event.target instanceof HTMLInputElement && event.target.checked
        ? 'true'
        : 'false'
      : event.target.value

    setInputValues((currentValues) => ({
      ...currentValues,
      [field.id]: value,
    }))
  }

  function renderFieldInput(field: InputFieldDefinition, hint: ReturnType<typeof resolveFieldHint>): ReactNode {
    const inputId = `generator-${field.id}`
    const value = inputValues[field.id] ?? ''

    if (field.type === 'multiline-text') {
      return (
        <textarea
          id={inputId}
          value={value}
          onChange={(event) => handleFieldChange(field, event)}
          placeholder={hint.placeholder}
          rows={8}
          aria-describedby={`${inputId}-help`}
        />
      )
    }

    if (field.type === 'enum') {
      return (
        <select
          id={inputId}
          value={value}
          onChange={(event) => handleFieldChange(field, event)}
          aria-describedby={`${inputId}-help`}
        >
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )
    }

    if (field.type === 'boolean') {
      return (
        <label className="checkbox-field" htmlFor={inputId}>
          <input
            id={inputId}
            type="checkbox"
            checked={value === 'true'}
            onChange={(event) => handleFieldChange(field, event)}
            aria-describedby={`${inputId}-help`}
          />
          <span>{field.label}</span>
        </label>
      )
    }

    return (
      <input
        id={inputId}
        type={field.type === 'integer' || field.type === 'number' ? 'number' : 'text'}
        value={value}
        onChange={(event) => handleFieldChange(field, event)}
        placeholder={hint.placeholder}
        min={field.min}
        max={field.max}
        pattern={field.pattern}
        aria-describedby={`${inputId}-help`}
      />
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setActionMessage(undefined)

    const input = Object.fromEntries(
      inputFields.map((field) => [
        field.id,
        parseFieldValue(field, inputValues[field.id] ?? ''),
      ]),
    ) as GeneratorInput
    const validation = generator.validate(input)

    if (!validation.valid) {
      setIssue(validation.issues[0] ?? {
        code: 'invalid-input',
        message: 'Input tidak valid.',
      })
      setOutputText(undefined)
      setOutputType(undefined)
      setOutputMimeType(undefined)
      setRunStatus('idle')
      return
    }

    setIssue(undefined)
    setRunStatus('running')

    try {
      const result = await generator.execute(input, {
        locale: 'id-ID',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        now: () => new Date(),
      })

      if (result.status === 'success') {
        const content = result.output.content
        setOutputText(
          typeof content === 'string' ? content : new TextDecoder().decode(content),
        )
        setOutputType(result.output.type)
        setOutputMimeType(result.output.mimeType)
        setRunStatus('success')
        return
      }

      if (result.status === 'failed') {
        setIssue({
          code: result.error.code,
          fieldId: result.error.fieldId,
          message: result.error.userMessage,
        })
      }

      setRunStatus('idle')
    } catch {
      setIssue({
        code: 'execution-failed',
        message: 'Generator gagal dijalankan. Coba lagi.',
      })
      setRunStatus('idle')
    }
  }

  function handleReset() {
    setInputValues(initialInputValues(inputFields))
    setOutputText(undefined)
    setOutputType(undefined)
    setOutputMimeType(undefined)
    setIssue(undefined)
    setActionMessage(undefined)
    setRunStatus('idle')
  }

  async function handleCopy() {
    if (outputText === undefined) {
      return
    }

    try {
      await navigator.clipboard.writeText(outputText)
      setActionMessage('Output berhasil disalin.')
    } catch {
      setActionMessage('Clipboard tidak tersedia. Salin output secara manual.')
    }
  }

  function handleDownload() {
    if (outputText === undefined) {
      return
    }

    const imageBlob = outputType === 'png'
      ? dataUrlToBlob(outputText, outputMimeType ?? 'image/png')
      : undefined
    const blob = imageBlob ?? new Blob([outputText], {
      type: outputMimeType ?? 'text/plain;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    const safeName = generator.definition.id.replaceAll('.', '-')

    anchor.href = url
    anchor.download = `${safeName}.${outputExtension(outputType)}`
    anchor.click()
    URL.revokeObjectURL(url)
    setActionMessage('File output siap diunduh.')
  }

  return (
    <section className="demo-section" aria-labelledby="generator-title">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Local Generator</p>
          <h2 id="generator-title">{generator.definition.name}</h2>
          <p className="section-description">{generator.definition.description}</p>
        </div>
        <span className="module-badge">Local · Offline</span>
      </div>

      <div className="demo-layout">
        <form className="generator-form" onSubmit={handleSubmit}>
          {inputFields.map((field) => {
            const inputId = `generator-${field.id}`
            const fieldIssue = issue?.fieldId === field.id ? issue : undefined
            const hint = resolveFieldHint(field, inputValues)

            return (
              <div className="field-group" key={field.id}>
                {field.type !== 'boolean' && (
                  <label className="field-label" htmlFor={inputId}>
                    {field.label}
                  </label>
                )}
                {renderFieldInput(field, hint)}
                {hint.helpText && (
                  <p className="field-help" id={`${inputId}-help`}>
                    {hint.helpText}
                  </p>
                )}
                {fieldIssue && (
                  <p className="field-error" role="alert">
                    {fieldIssue.message}
                  </p>
                )}
              </div>
            )
          })}
          {issue && !issue.fieldId && (
            <p className="field-error" role="alert">
              {issue.message}
            </p>
          )}
          <div className="form-actions">
            <button className="primary-button" type="submit" disabled={runStatus === 'running'}>
              {runStatus === 'running'
                ? 'Memproses...'
                : generator.definition.primaryActionLabel ?? 'Generate'}
            </button>
            <button className="secondary-button" type="button" onClick={handleReset}>
              Reset
            </button>
          </div>
        </form>

        <div className="output-panel" aria-live="polite">
          <div className="output-heading">
            <span>Output</span>
            {runStatus === 'success' && <span className="success-label">Berhasil</span>}
          </div>
          {outputText === undefined ? (
            <p className="output-empty">Output akan muncul di sini setelah generator dijalankan.</p>
          ) : (
            <>
              {outputType === 'png' ? (
                <div className="output-image-frame">
                  <img className="output-image" src={outputText} alt="QR Code output" />
                </div>
              ) : (
                <pre className="output-content">{outputText}</pre>
              )}
              <div className="output-actions">
                {generator.definition.capabilities.copy && (
                  <button className="secondary-button" type="button" onClick={handleCopy}>
                    Copy output
                  </button>
                )}
                {generator.definition.capabilities.download && (
                  <button className="secondary-button" type="button" onClick={handleDownload}>
                    Download
                  </button>
                )}
                {actionMessage && <span className="action-message">{actionMessage}</span>}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
