interface AiDataBoundaryNoticeProps {
  readonly providerDisplayName: string
  readonly model: string
  readonly baseUrl: string
  readonly dataDescription: string
  readonly consentGiven: boolean
  readonly onConsentChange: (consentGiven: boolean) => void
}

export function AiDataBoundaryNotice({
  providerDisplayName,
  model,
  baseUrl,
  dataDescription,
  consentGiven,
  onConsentChange,
}: AiDataBoundaryNoticeProps) {
  return (
    <section className="ai-data-boundary" aria-labelledby="ai-data-boundary-title" role="note">
      <p className="section-kicker">Data boundary</p>
      <h3 id="ai-data-boundary-title">Data akan dikirim ke provider AI</h3>
      <p>
        WorkGen tidak mengirim data AI saat Anda mengetik atau hanya membuka preview. Pengiriman
        terjadi setelah Anda menyetujui notice ini dan menekan tombol Generate.
      </p>
      <dl className="ai-data-boundary-details">
        <div>
          <dt>Provider</dt>
          <dd>{providerDisplayName}</dd>
        </div>
        <div>
          <dt>Model</dt>
          <dd>{model}</dd>
        </div>
        <div>
          <dt>Base URL</dt>
          <dd>{baseUrl}</dd>
        </div>
        <div>
          <dt>Data yang dikirim</dt>
          <dd>{dataDescription}</dd>
        </div>
      </dl>
      <label className="ai-consent-checkbox">
        <input
          type="checkbox"
          checked={consentGiven}
          onChange={(event) => onConsentChange(event.target.checked)}
        />
        <span>Saya memahami data ini akan dikirim ke provider yang tercantum di atas.</span>
      </label>
    </section>
  )
}
