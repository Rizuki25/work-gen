import { useState, type FormEvent } from 'react'
import type { GeneratorModule, ValidationIssue } from '../../modules/contracts'

interface DummyGeneratorPanelProps {
  readonly generator: GeneratorModule
}

type RunStatus = 'idle' | 'running' | 'success'

export function DummyGeneratorPanel({ generator }: DummyGeneratorPanelProps) {
  const [inputText, setInputText] = useState('')
  const [outputText, setOutputText] = useState<string | undefined>()
  const [issue, setIssue] = useState<ValidationIssue | undefined>()
  const [runStatus, setRunStatus] = useState<RunStatus>('idle')
  const [copyMessage, setCopyMessage] = useState<string | undefined>()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setCopyMessage(undefined)

    const input = { text: inputText }
    const validation = generator.validate(input)

    if (!validation.valid) {
      setIssue(validation.issues[0] ?? {
        code: 'invalid-input',
        message: 'Input tidak valid.',
      })
      setOutputText(undefined)
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
    setInputText('')
    setOutputText(undefined)
    setIssue(undefined)
    setCopyMessage(undefined)
    setRunStatus('idle')
  }

  async function handleCopy() {
    if (outputText === undefined) {
      return
    }

    try {
      await navigator.clipboard.writeText(outputText)
      setCopyMessage('Output berhasil disalin.')
    } catch {
      setCopyMessage('Clipboard tidak tersedia. Salin output secara manual.')
    }
  }

  return (
    <section className="demo-section" aria-labelledby="demo-generator-title">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Vertical slice pertama</p>
          <h2 id="demo-generator-title">{generator.definition.name}</h2>
          <p className="section-description">{generator.definition.description}</p>
        </div>
        <span className="module-badge">Local · Offline</span>
      </div>

      <div className="demo-layout">
        <form className="generator-form" onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="demo-text-input">
            Teks input
          </label>
          <textarea
            id="demo-text-input"
            value={inputText}
            onChange={(event) => setInputText(event.target.value)}
            placeholder="Ketik teks untuk menguji generator lokal..."
            rows={8}
            aria-describedby="demo-text-help"
          />
          <p className="field-help" id="demo-text-help">
            Teks ini diproses sepenuhnya di browser.
          </p>
          {issue && (
            <p className="field-error" role="alert">
              {issue.message}
            </p>
          )}
          <div className="form-actions">
            <button className="primary-button" type="submit" disabled={runStatus === 'running'}>
              {runStatus === 'running' ? 'Menjalankan...' : 'Generate'}
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
              <pre className="output-content">{outputText}</pre>
              <div className="output-actions">
                <button className="secondary-button" type="button" onClick={handleCopy}>
                  Copy output
                </button>
                {copyMessage && <span className="copy-message">{copyMessage}</span>}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
