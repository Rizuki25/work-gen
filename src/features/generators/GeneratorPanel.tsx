import { useState, type FormEvent } from 'react'
import type {
  GeneratorModule,
  OutputType,
  ValidationIssue,
} from '../../modules/contracts'

interface GeneratorPanelProps {
  readonly generator: GeneratorModule
}

type RunStatus = 'idle' | 'running' | 'success'

function outputExtension(outputType: OutputType | undefined): string {
  switch (outputType) {
    case 'json':
      return 'json'
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

export function GeneratorPanel({ generator }: GeneratorPanelProps) {
  const inputField = generator.definition.inputSchema.fields[0]
  const [inputValue, setInputValue] = useState('')
  const [outputText, setOutputText] = useState<string | undefined>()
  const [outputType, setOutputType] = useState<OutputType | undefined>()
  const [outputMimeType, setOutputMimeType] = useState<string | undefined>()
  const [issue, setIssue] = useState<ValidationIssue | undefined>()
  const [runStatus, setRunStatus] = useState<RunStatus>('idle')
  const [actionMessage, setActionMessage] = useState<string | undefined>()

  if (!inputField) {
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setActionMessage(undefined)

    const input = { [inputField.id]: inputValue }
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
    setInputValue('')
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

    const blob = new Blob([outputText], {
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
          <label className="field-label" htmlFor={`generator-${inputField.id}`}>
            {inputField.label}
          </label>
          <textarea
            id={`generator-${inputField.id}`}
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            placeholder={inputField.placeholder}
            rows={8}
            aria-describedby={`generator-${inputField.id}-help`}
          />
          {inputField.helpText && (
            <p className="field-help" id={`generator-${inputField.id}-help`}>
              {inputField.helpText}
            </p>
          )}
          {issue && (
            <p className="field-error" role="alert">
              {issue.message}
            </p>
          )}
          <div className="form-actions">
            <button className="primary-button" type="submit" disabled={runStatus === 'running'}>
              {runStatus === 'running' ? 'Memproses...' : 'Format JSON'}
            </button>
            <button className="secondary-button" type="button" onClick={handleReset}>
              Reset
            </button>
          </div>
        </form>

        <div className="output-panel" aria-live="polite">
          <div className="output-heading">
            <span>Output JSON</span>
            {runStatus === 'success' && <span className="success-label">Valid</span>}
          </div>
          {outputText === undefined ? (
            <p className="output-empty">JSON terformat akan muncul di sini.</p>
          ) : (
            <>
              <pre className="output-content">{outputText}</pre>
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
