# Product Requirements Document — WorkGen

**Versi:** 0.1 (Draft untuk development)  
**Tanggal:** 7 Agustus 2026  
**Status:** Draft  
**Nama produk:** WorkGen  
**Tipe produk:** Aplikasi produktivitas hybrid, local-first, modular

## 1. Ringkasan eksekutif

WorkGen adalah aplikasi produktivitas untuk membuat, mengubah, memformat, dan mengotomatisasi pekerjaan berulang. Produk ini menggunakan pendekatan **hybrid**: fitur yang dapat dikerjakan secara deterministik berjalan lokal tanpa internet dan tanpa AI, sedangkan AI tersedia sebagai lapisan opsional untuk pekerjaan yang membutuhkan pemahaman bahasa, peringkasan, penulisan, atau transformasi berbasis instruksi natural language.

WorkGen memiliki tiga jenis fitur utama:

1. **Local Generator** — generator dan utilitas yang berjalan penuh di perangkat pengguna.
2. **Template Generator** — generator berbasis formulir, aturan, dan template yang tidak membutuhkan AI.
3. **AI Generator** — generator berbasis model AI yang hanya digunakan jika pengguna mengaktifkan dan mengonfigurasi provider.

Prinsip produk yang paling penting adalah: **WorkGen tetap berguna walaupun tidak ada API key, tidak ada koneksi internet, atau provider AI sedang bermasalah.** AI menambah kemampuan, bukan menjadi syarat dasar penggunaan produk.

## 2. Vision

Menjadikan WorkGen sebagai **kotak alat kerja pribadi yang cepat, privat, dan dapat dikembangkan**, tempat pengguna menyelesaikan pekerjaan rutin dari satu aplikasi tanpa harus berpindah-pindah antara banyak situs generator, spreadsheet, dan chat AI.

Dalam jangka panjang, WorkGen diharapkan menjadi platform generator modular yang dapat:

- menyelesaikan tugas sederhana secara instan dan offline;
- menghasilkan dokumen kerja yang konsisten melalui template;
- memanfaatkan provider AI pilihan pengguna tanpa mengunci pengguna pada satu vendor;
- menjaga batas data tetap jelas dan dapat dikendalikan pengguna;
- diperluas dengan modul baru tanpa mengubah inti aplikasi.

## 3. Goals

### 3.1 Product goals

- Menyediakan utilitas kerja harian yang dapat digunakan tanpa setup rumit.
- Mengurangi pekerjaan copy-paste dan pengulangan pada tugas kantor serta tugas teknis.
- Memastikan fitur lokal dan template tetap berfungsi ketika offline.
- Memberikan pilihan provider AI melalui konfigurasi yang transparan.
- Memudahkan pengguna menyalin, mengunduh, atau menggunakan hasil generator di aplikasi lain.
- Menjadi fondasi yang cukup modular untuk menambah generator baru secara bertahap.

### 3.2 User goals

Pengguna dapat:

- menemukan generator yang dibutuhkan dalam waktu singkat;
- membuat output yang konsisten dari input terstruktur;
- menggunakan AI hanya pada bagian pekerjaan yang memang membutuhkannya;
- memahami data apa yang dikirim ke provider eksternal;
- memulihkan diri dari error tanpa kehilangan input;
- menyimpan atau menghapus hasil kerja sesuai kebutuhan.

### 3.3 Indikator keberhasilan awal

Target ini digunakan untuk mengevaluasi MVP, bukan sebagai batas teknis mutlak:

| Indikator | Target MVP |
|---|---:|
| Waktu dari membuka aplikasi sampai menghasilkan output lokal pertama | ≤ 2 menit |
| Fitur Local Generator yang tetap berfungsi dalam mode pesawat | 100% |
| Pengguna dapat membuat output template tanpa API key | 100% |
| Waktu konfigurasi provider AI setelah data tersedia | ≤ 5 menit |
| Kegagalan AI yang mempertahankan input pengguna | 100% |
| API key muncul dalam log atau history | 0 kasus |
| Generator MVP dapat ditemukan melalui pencarian | 100% |

## 4. Non-goals

Hal berikut tidak menjadi fokus MVP:

- menjadi pengganti penuh Microsoft Office, Google Workspace, atau editor dokumen kolaboratif;
- menyediakan penyimpanan cloud dan sinkronisasi lintas perangkat;
- menyediakan akun, organisasi, role management, atau billing;
- melatih atau meng-host model AI sendiri;
- menjalankan agent AI otonom yang mengubah file atau sistem tanpa persetujuan eksplisit;
- mengirim semua aktivitas pengguna ke server untuk analytics;
- mendukung marketplace plugin publik sejak versi pertama;
- menjamin provider pihak ketiga selalu tersedia atau mempertahankan kebijakan datanya;
- melakukan operasi file destruktif secara otomatis.

## 5. Target users

### 5.1 Persona utama: staf administrasi dan operasional

Membuat laporan harian, email, notulen, surat, invoice, dan dokumen rutin. Tidak selalu memiliki pengetahuan teknis. Membutuhkan form yang jelas dan output siap salin.

### 5.2 Persona utama: developer atau technical operator

Membuat JSON/YAML, `.env`, konfigurasi, UUID, hash, dummy data, regex, SQL, command, dan struktur proyek. Menghargai kecepatan, format yang tepat, dan kemampuan bekerja offline.

### 5.3 Persona sekunder: pemilik usaha, freelancer, dan pelajar

Membutuhkan alat serbaguna untuk dokumen, data, dan tugas administratif tanpa berlangganan banyak layanan.

### 5.4 Persona yang bukan target awal

- perusahaan yang memerlukan governance, audit trail, dan kontrol akses multi-user;
- pengguna yang menginginkan suite kolaborasi dokumen real-time;
- pengguna yang mengharapkan AI selalu aktif dan mengelola seluruh pekerjaan secara otomatis.

## 6. Core principles

### 6.1 Local-first

Fungsi yang tidak membutuhkan server harus berjalan di perangkat pengguna. Ketiadaan jaringan tidak boleh membuat utilitas dasar gagal.

### 6.2 AI optional

Tidak ada Local Generator atau Template Generator yang boleh bergantung pada AI untuk alur normalnya. Fitur AI harus diberi label jelas sebagai opsional.

### 6.3 Explicit data boundary

Sebelum data dikirim ke provider AI, pengguna harus dapat memahami bahwa data tersebut akan keluar dari perangkat. Jangan mengirim field yang tidak dibutuhkan.

### 6.4 Simple by default, powerful when needed

Form sederhana menjadi jalur utama. Opsi lanjutan seperti system instruction, temperature, output format, atau provider override tidak boleh menghalangi pengguna baru.

### 6.5 Deterministic where possible

Output Local Generator dan Template Generator harus dapat diprediksi, divalidasi, serta mudah diuji. Randomness harus dapat dikontrol jika relevan.

### 6.6 Output ownership

Hasil adalah milik pengguna. Pengguna dapat menyalin, mengunduh, menghapus, atau membersihkan history tanpa vendor lock-in.

### 6.7 Modular development

Generator baru harus dapat ditambahkan sebagai modul yang mengikuti kontrak umum, bukan melalui perubahan yang menyebar ke seluruh aplikasi.

### 6.8 Safe failure

Error harus ditampilkan dalam bahasa yang dapat ditindaklanjuti. Input pengguna dipertahankan, secret disamarkan, dan aplikasi tidak boleh crash karena satu generator gagal.

## 7. Product scope dan prioritas

### 7.1 Area produk

| Area | Deskripsi | Prioritas |
|---|---|---|
| App shell | Navigasi, search, kategori, halaman generator, settings | Must |
| Local Generator | Utilitas deterministik yang offline | Must |
| Template Generator | Form dan template untuk output kerja | Must |
| AI Generator | Text generation/rewrite dengan provider pilihan pengguna | Must, dengan scope terbatas |
| Output handling | Preview, copy, download, clear, regenerate | Must |
| History | Riwayat lokal yang dapat dihapus | Should |
| Favorites/recent | Akses cepat ke generator | Should |
| Custom template builder | Membuat template sendiri dari UI | Could |
| External plugin SDK | Modul pihak ketiga | Future |
| Cloud sync | Sinkronisasi lintas perangkat | Future |

### 7.2 MVP: App shell

MVP harus memiliki:

- halaman Home dengan generator yang sering digunakan dan recent tools;
- navigasi kategori: Local, Template, AI;
- pencarian berdasarkan nama, deskripsi, kategori, dan tag;
- halaman detail generator dengan judul, deskripsi singkat, input, tombol aksi, dan output;
- status offline yang terlihat tetapi tidak mengganggu fitur lokal;
- Settings untuk provider AI, privacy/data, dan appearance minimal;
- empty state, loading state, success state, dan error state.

### 7.3 MVP: Local Generator

Daftar awal berikut diprioritaskan karena berguna, mudah divalidasi, dan tidak membutuhkan AI:

| Generator | Input utama | Output |
|---|---|---|
| UUID Generator | jumlah, format | UUID v4 |
| Password Generator | panjang, tipe karakter, jumlah | password acak |
| Hash Generator | teks/file opsional, algoritma | hash hex/base64 |
| JSON Formatter/Validator | JSON mentah | JSON terformat atau pesan validasi |
| JSON ↔ YAML | data JSON/YAML | format tujuan |
| CSV ↔ JSON | teks CSV/JSON, delimiter | format tujuan |
| Base64 Encoder/Decoder | teks | Base64 atau teks hasil decode |
| Timestamp Converter | timestamp/tanggal, timezone | tanggal atau timestamp |
| Regex Tester | pattern, sample text, flags | match, group, posisi |
| Lorem/Dummy Data | tipe data, jumlah, locale | teks atau data terstruktur |
| QR Code Generator | teks/URL, ukuran | QR code yang dapat disimpan |
| Text Counter | teks | jumlah karakter, kata, baris |

Persyaratan umum Local Generator:

- berjalan tanpa request jaringan;
- validasi input sebelum proses;
- menampilkan output secara langsung jika proses ringan;
- menyediakan Copy dan Download jika output dapat disimpan;
- menyediakan Reset;
- tidak menyimpan input sensitif ke log;
- untuk random generator, menyediakan opsi generate ulang.

### 7.4 MVP: Template Generator

Template Generator menggunakan form terstruktur dan aturan lokal. AI tidak boleh dipanggil pada alur default.

Template MVP:

1. **Daily Report**
   - tanggal, nama, tim, pekerjaan selesai, pekerjaan berjalan, kendala, rencana berikutnya;
   - output Markdown dan plain text;
   - placeholder yang kosong ditangani dengan cara yang konsisten.
2. **Weekly Report**
   - periode, ringkasan, pencapaian, metrik, kendala, rencana minggu berikutnya;
   - output Markdown.
3. **Meeting Minutes**
   - judul, tanggal, peserta, agenda, pembahasan, keputusan, action items, owner, due date;
   - output Markdown dan plain text.
4. **Business Email**
   - tujuan email, penerima opsional, subjek, konteks, poin utama, call to action, tone;
   - output subjek dan isi email;
   - tone hanya mengubah template lokal, bukan memanggil AI.
5. **SOP sederhana**
   - judul, tujuan, ruang lingkup, prasyarat, langkah, pemeriksaan, eskalasi;
   - output Markdown.
6. **Invoice sederhana**
   - identitas penjual/pembeli, item, qty, harga, pajak/diskon opsional, catatan;
   - kalkulasi subtotal dan total dilakukan lokal;
   - output Markdown/HTML; PDF dapat menjadi fase berikutnya.

Persyaratan umum Template Generator:

- form harus memiliki label, contoh input, validasi, dan penanda field wajib;
- output dibangun dari template versioned;
- kalkulasi angka menggunakan tipe angka, bukan operasi string;
- template dapat diuji dengan fixture data;
- format output harus konsisten untuk input yang sama;
- pengguna dapat mengedit output sebelum menyalin atau menyimpan.

### 7.5 MVP: AI Generator opsional

AI Generator MVP tidak mencoba mencakup semua pekerjaan. Fokus awal:

- **Freeform Text Generator** — instruksi, konteks, tone, panjang, output;
- **Rewrite** — teks, gaya tujuan, batasan;
- **Summarizer** — teks, panjang ringkasan, format poin/paragraf;
- **Command Generator** — kebutuhan natural language, OS/shell, batasan keamanan;
- **SQL/Formula Helper** — bahasa/database atau konteks spreadsheet, kebutuhan, output;
- **Template enhancement opsional** — tombol “Improve with AI” pada hasil template, dengan persetujuan sebelum data dikirim.

Batasan MVP AI:

- provider harus dikonfigurasi pengguna;
- request tidak dijalankan tanpa provider aktif dan API key yang valid;
- AI tidak boleh melakukan eksekusi command, SQL, atau perubahan file;
- hasil AI diberi label sebagai output yang perlu ditinjau;
- fitur AI harus tetap menampilkan input dan mempertahankan draft ketika request gagal.

### 7.6 Output handling

Setiap generator minimal menyediakan:

- preview output;
- Copy to clipboard;
- Download/save sesuai tipe output;
- Clear/Reset;
- status waktu pembuatan;
- untuk AI: Regenerate, Edit prompt, dan Stop/Cancel jika request masih berjalan.

Format output MVP:

- plain text;
- Markdown;
- JSON;
- CSV;
- HTML untuk template tertentu;
- gambar PNG untuk QR code.

## 8. Information architecture

```text
WorkGen
├── Home
│   ├── Search
│   ├── Favorite generators
│   ├── Recent generators
│   └── Quick actions
├── Generators
│   ├── Local
│   │   ├── Text & Format
│   │   ├── Data & Conversion
│   │   ├── Security & Random
│   │   └── Utility
│   ├── Template
│   │   ├── Reports
│   │   ├── Communication
│   │   ├── Meeting & Process
│   │   └── Business
│   └── AI
│       ├── Writing
│       ├── Transform
│       └── Developer Assistant
├── History
├── Favorites
└── Settings
    ├── AI Providers
    ├── Privacy & Data
    ├── Appearance
    └── About
```

### 8.1 Struktur halaman generator

```text
Generator detail
├── Breadcrumb/category
├── Title + description + badge (Local/Template/AI)
├── Input panel
│   ├── Field/form controls
│   ├── Advanced options (opsional)
│   └── Primary action
├── Data boundary notice (untuk AI)
├── Output panel
│   ├── Preview/editor
│   ├── Format selector
│   └── Copy / Download / Clear / Regenerate
└── Error, warning, atau informational state
```

## 9. User flows

### 9.1 First run dan penggunaan lokal

1. Pengguna membuka WorkGen.
2. Home menampilkan tiga kategori dan beberapa generator populer.
3. Pengguna memilih JSON Formatter.
4. Pengguna menempelkan JSON.
5. Aplikasi memvalidasi dan menampilkan hasil atau lokasi error.
6. Pengguna menyalin atau mengunduh hasil.
7. Tidak ada onboarding provider AI yang wajib.

### 9.2 Membuat daily report tanpa AI

1. Pengguna membuka Template → Reports → Daily Report.
2. Pengguna mengisi field yang wajib dan opsional.
3. Pengguna memilih format Markdown atau plain text.
4. Pengguna menekan Generate.
5. WorkGen merender template secara lokal.
6. Pengguna mengedit hasil jika perlu, lalu Copy atau Download.

### 9.3 Menambahkan provider AI OpenAI-compatible

1. Pengguna membuka Settings → AI Providers.
2. Pengguna memilih Add provider.
3. Pengguna memasukkan nama konfigurasi, Base URL, API key, dan model.
4. Aplikasi memvalidasi format Base URL dan memastikan API key tidak kosong.
5. Pengguna menekan Test connection.
6. Aplikasi mengirim request pengujian minimal ke endpoint provider melalui HTTPS.
7. Aplikasi menampilkan hasil, latency, model yang diuji, dan pesan error yang aman.
8. Pengguna menyimpan konfigurasi dan dapat menjadikannya default.

### 9.4 Menggunakan AI Generator

1. Pengguna membuka AI → Rewrite.
2. Pengguna mengisi teks dan instruksi.
3. UI menampilkan notice bahwa teks akan dikirim ke provider yang dipilih.
4. Pengguna menekan Generate.
5. Aplikasi membuat request sesuai provider/model.
6. UI menampilkan loading dan opsi Cancel.
7. Jika berhasil, output ditampilkan sebagai hasil yang dapat diedit.
8. Jika gagal, input dan draft tetap tersedia, dengan opsi Retry atau membuka Settings.

### 9.5 Offline atau provider tidak tersedia

1. Aplikasi mendeteksi offline atau request timeout.
2. Local dan Template tetap dapat digunakan.
3. AI Generator menampilkan state “AI tidak tersedia saat ini”.
4. Input tidak dihapus.
5. Pengguna dapat Retry setelah jaringan tersedia atau beralih ke generator lokal/template.

## 10. Functional requirements

### FR-01 — Registry dan discovery generator

- Semua generator didaftarkan melalui registry terpusat.
- Setiap generator memiliki `id` yang stabil, nama, deskripsi, jenis, kategori, tag, icon, versi, dan status.
- Search melakukan pencocokan case-insensitive pada nama, deskripsi, dan tag.
- Generator yang tidak tersedia tidak boleh membuat seluruh registry gagal dimuat.
- Registry menyediakan daftar `featured`, `recent`, dan `favorite`.

### FR-02 — Kontrak input dan validasi

- Setiap generator mendeklarasikan input schema.
- Field mendukung tipe minimal: string, integer, number, boolean, enum, multiline text, date, date-time, list, dan object sederhana.
- Schema mendukung required, default, min/max, pattern, placeholder, help text, dan secret flag.
- Validasi dilakukan sebelum eksekusi.
- Pesan validasi menyebut field dan tindakan perbaikannya.
- Input yang sudah diisi dipertahankan ketika validasi atau eksekusi gagal.

### FR-03 — Eksekusi Local Generator

- Local Generator tidak boleh memanggil internet pada alur normal.
- Proses berjalan melalui service lokal dengan timeout internal agar UI tidak macet.
- Hasil yang tidak valid atau exception ditangani menjadi error terstruktur.
- Generator random menggunakan sumber random yang sesuai untuk tujuan pengguna; password/hash tidak boleh menggunakan random yang lemah.
- Operasi file, bila ditambahkan, harus meminta path/input secara eksplisit dan tidak melakukan delete atau overwrite tanpa konfirmasi.

### FR-04 — Eksekusi Template Generator

- Template didefinisikan sebagai aset versioned dengan field schema dan renderer.
- Renderer mendukung conditional section sederhana, list item, escaping, dan format tanggal/angka.
- Semua kalkulasi invoice dilakukan di service domain lokal dan dapat diuji terpisah dari UI.
- Template tidak boleh memanggil provider AI secara diam-diam.
- Hasil template dapat dibuka di editor output sebelum disalin.

### FR-05 — AI provider configuration

MVP wajib mendukung konfigurasi provider dengan field berikut:

| Field | Wajib | Aturan |
|---|:---:|---|
| Display name | Ya | Nama lokal yang mudah dikenali |
| Provider type | Ya | Minimal `openai-compatible` |
| Base URL | Ya | URL absolut `http`/`https`; `https` direkomendasikan dan wajib untuk endpoint produksi |
| API key | Ya untuk request | Disimpan di secure storage, tidak ditampilkan penuh |
| Model | Ya | Nama model yang dikirim ke API |
| Timeout | Tidak | Default yang aman, misalnya 60 detik |
| Max output tokens | Tidak | Nilai default sesuai provider |
| Temperature | Tidak | Ditampilkan pada advanced settings |
| Active/default | Tidak | Maksimal satu default per provider context |

Perilaku konfigurasi:

- pengguna dapat menambah, mengedit, menghapus, menduplikasi, dan memilih provider default;
- API key ditampilkan masked dan memiliki aksi Replace/Clear;
- API key tidak boleh masuk ke URL, telemetry, error detail, clipboard otomatis, atau history;
- Base URL dinormalisasi agar tidak menghasilkan double slash saat membentuk endpoint;
- aplikasi menolak URL dengan scheme yang tidak didukung;
- custom Base URL diperbolehkan untuk endpoint OpenAI-compatible seperti gateway perusahaan, proxy pribadi, atau provider lokal yang mengikuti kontrak tersebut;
- untuk endpoint `http` non-local, aplikasi menampilkan peringatan keamanan dan meminta konfirmasi sebelum menyimpan/menggunakannya;
- aplikasi tidak boleh menonaktifkan validasi sertifikat TLS;
- konfigurasi provider disimpan lokal dan dapat diekspor tanpa secret secara default.

### FR-06 — Test connection

Tombol Test connection harus:

- tersedia sebelum provider diset sebagai default;
- memeriksa Base URL, API key, dan model;
- mengirim request minimal ke provider, tanpa data bisnis pengguna;
- memprioritaskan `GET /models` jika kompatibel, lalu dapat melakukan request chat/completion minimal untuk memverifikasi model;
- menangani provider yang tidak mendukung `GET /models` dengan pesan yang jelas atau fallback yang terkontrol;
- menampilkan status berhasil/gagal, endpoint yang digunakan tanpa API key, model, latency, dan langkah perbaikan;
- tidak menyimpan isi response pengujian ke history secara default;
- memiliki timeout dan Cancel;
- menyamarkan token, header rahasia, dan detail credential pada error.

### FR-07 — AI request dan output

- AI Generator menggunakan provider default atau provider override yang dipilih pengguna.
- Request memisahkan system instruction dan user input bila API mendukung.
- Data input dikirim seminimal mungkin sesuai fungsi generator.
- UI menampilkan provider dan model yang akan digunakan sebelum request dikirim.
- UI menampilkan notice data boundary pada penggunaan pertama dan menyediakan tautan ke Privacy & Data.
- Request dapat dibatalkan bila transport mendukung cancellation.
- Response streaming dapat menjadi opsi implementasi, tetapi output final harus tetap diproses secara aman.
- Output AI diberi metadata lokal: generator, provider, model, timestamp, dan status.
- Aplikasi tidak menganggap hasil AI benar; tampilkan catatan “periksa kembali hasil”.
- Command, SQL, atau formula yang dihasilkan hanya berupa teks sampai pengguna menyalin atau menyimpan secara eksplisit.

### FR-08 — Output dan file

- Copy harus memberi feedback sukses/gagal.
- Download meminta format dan lokasi bila diperlukan oleh platform.
- Filename default dibuat aman dan tidak menggunakan karakter ilegal.
- Output dapat dihapus dari halaman tanpa menghapus input secara tidak sengaja.
- Untuk output besar, UI tidak boleh memblokir rendering atau menyalin tanpa batas memori yang wajar.

### FR-09 — History dan favorites

- History lokal menyimpan minimal generator, timestamp, ringkasan input, dan output bila pengguna mengaktifkannya.
- Default history untuk input/output sensitif harus dapat dinonaktifkan dari Settings.
- Pengguna dapat menghapus satu item, seluruh history, atau mematikan history.
- History tidak pernah menyimpan API key.
- Favorite hanya menyimpan referensi `generatorId`, bukan salinan modul.

### FR-10 — Settings dan preferences

- Settings dapat dibuka tanpa jaringan.
- Perubahan provider tidak mengubah hasil local/template.
- Pengguna dapat memilih theme, bahasa jika nantinya didukung, default output format, dan kebijakan history.
- Reset settings memiliki konfirmasi dan tidak menghapus file output yang sudah disimpan pengguna.

### FR-11 — Accessibility dan usability minimum

- Semua input memiliki label yang dapat dibaca screen reader.
- Fokus keyboard dapat berpindah secara logis.
- Kontras teks dan status error memadai.
- Error tidak hanya dibedakan melalui warna.
- Kontrol utama dapat digunakan pada ukuran layar desktop yang umum.

## 11. AI provider settings: detail implementasi

### 11.1 Model konfigurasi yang disarankan

```json
{
  "id": "provider-local-uuid",
  "displayName": "OpenAI pribadi",
  "type": "openai-compatible",
  "baseUrl": "https://api.example.com/v1",
  "model": "example-model",
  "apiKeyRef": "secure:provider-local-uuid:api-key",
  "timeoutMs": 60000,
  "maxOutputTokens": 2048,
  "temperature": 0.3,
  "isDefault": true,
  "createdAt": "2026-08-07T00:00:00Z",
  "updatedAt": "2026-08-07T00:00:00Z"
}
```

`apiKeyRef` hanya merupakan reference ke secure storage. Nilai secret tidak disimpan di object konfigurasi biasa.

### 11.2 Endpoint adapter

Adapter `openai-compatible` bertanggung jawab untuk:

- normalisasi Base URL;
- membentuk endpoint `/chat/completions` atau endpoint yang ditetapkan adapter;
- menambahkan header authorization tanpa menuliskannya ke log;
- memetakan error HTTP/provider ke error domain WorkGen;
- memvalidasi field response yang dibutuhkan;
- mendukung model lokal/gateway yang memakai format request serupa;
- menyediakan capability flags seperti `supportsModelList`, `supportsStreaming`, dan `supportsCancellation`.

Desain harus memungkinkan adapter baru di masa depan, misalnya Anthropic-compatible, Gemini-compatible, Ollama, atau provider enterprise, tanpa mengubah generator AI.

### 11.3 Test connection acceptance behavior

- Base URL kosong: blokir sebelum network call.
- URL malformed: tampilkan validasi inline.
- API key kosong: tampilkan “API key diperlukan untuk menguji koneksi”.
- Model kosong: tampilkan “Model diperlukan”.
- 401/403: “Credential ditolak atau tidak memiliki akses ke model ini.”
- 404: “Endpoint atau model tidak ditemukan. Periksa Base URL dan model.”
- 429: “Batas penggunaan provider tercapai. Coba lagi nanti.”
- timeout: “Provider tidak merespons dalam batas waktu.”
- TLS/network: “Koneksi aman ke provider gagal.”
- sukses: tampilkan provider tersambung dan model dapat digunakan.

## 12. Offline behavior

### 12.1 Ketika tidak ada internet

- Local Generator tetap 100% tersedia.
- Template Generator tetap 100% tersedia.
- History, favorites, settings, dan output lokal tetap tersedia.
- AI Generator tetap dapat dibuka untuk melihat form dan draft, tetapi request tidak dipaksakan.
- Test connection gagal cepat dengan state offline, bukan loading tanpa batas.
- Pengguna dapat mengedit Base URL, model, dan provider secara offline.
- Aplikasi tidak membuat hasil AI palsu atau menampilkan cache sebagai hasil baru tanpa label.

### 12.2 Ketika jaringan ada tetapi provider gagal

- Bedakan error offline, timeout, unauthorized, rate limit, server error, dan malformed response.
- Pertahankan semua field input serta output sebelumnya.
- Sediakan Retry dengan request baru yang disengaja.
- Jangan melakukan retry otomatis tanpa batas.
- Jika ada provider lain yang sudah dikonfigurasi, tawarkan switch provider tanpa mengirim request baru sampai pengguna menyetujui.

### 12.3 Network detection

Network detection hanya digunakan untuk UX dan optimasi. Kebenaran akhir tetap berasal dari hasil request. Local Generator tidak boleh menunggu status network.

## 13. Data dan privacy

### 13.1 Prinsip penyimpanan

- Tidak ada akun yang diwajibkan untuk MVP.
- Data aplikasi disimpan lokal secara default.
- Tidak ada telemetry atau analytics eksternal secara default.
- History dapat dimatikan dan dibersihkan.
- File yang diunduh hanya ada di lokasi yang dipilih pengguna.

### 13.2 Data classification

| Data | Default storage | Boleh dikirim ke AI? | Kebijakan |
|---|---|---:|---|
| Generator metadata | Lokal | Tidak perlu | Tidak sensitif |
| Preferences | Lokal | Tidak | Dapat di-reset |
| API key | Secure storage | Sebagai header auth | Tidak pernah ditampilkan/log |
| Input Local/Template | Memori, history opsional | Tidak | Tidak keluar perangkat |
| Input AI | Memori, history opsional | Ya, setelah aksi pengguna | Tampilkan data boundary |
| Output AI | Memori, history opsional | Tidak perlu dikirim ulang | Labeli sebagai hasil AI |
| Log error | Lokal terbatas | Tidak | Redact secret dan isi sensitif |

### 13.3 Persetujuan penggunaan AI

- Pada penggunaan AI pertama, tampilkan provider, model, Base URL, dan jenis data yang dikirim.
- Pengguna harus menekan aksi Generate secara eksplisit.
- Tombol Improve with AI pada template harus menjelaskan bahwa isi template akan dikirim.
- Jangan mengirim input ketika pengguna hanya mengetik, berpindah field, membuka preview, atau menekan Test connection.
- Sediakan opsi “jangan tampilkan lagi di perangkat ini” hanya jika pengguna dapat membukanya kembali dari Settings.

### 13.4 Secret handling

- Gunakan secure storage bawaan platform bila tersedia.
- Database biasa hanya menyimpan reference secret atau metadata non-sensitif.
- Masking diterapkan pada UI dan error serializer.
- Jangan menaruh API key di source code, default config, crash report, clipboard, atau URL query string.
- Saat provider dihapus, tawarkan penghapusan secret terkait.
- Import konfigurasi tidak mengimpor secret secara default.

### 13.5 Custom Base URL security

Custom Base URL memberi fleksibilitas tetapi menambah risiko. MVP harus:

- memvalidasi scheme dan URL;
- menggunakan TLS untuk endpoint non-local;
- menampilkan hostname yang akan menerima data;
- memberi peringatan untuk HTTP atau host yang bukan localhost;
- tidak mengikuti redirect ke host lain tanpa memeriksa ulang kebijakan keamanan;
- tidak mendukung bypass sertifikat;
- menyiapkan abstraction agar validasi SSRF dan allowlist dapat ditambahkan untuk deployment enterprise.

## 14. Suggested architecture

Arsitektur yang disarankan adalah **modular clean architecture dengan port-and-adapter**. Implementasi dapat menggunakan Flutter/Dart, desktop webview, atau framework cross-platform lain; kontrak domain harus tetap framework-agnostic.

```text
Presentation layer
  ├── App shell, navigation, screens, components
  └── State management / view models

Application layer
  ├── RunGeneratorUseCase
  ├── ValidateInputUseCase
  ├── TestProviderConnectionUseCase
  ├── GenerateWithAIUseCase
  └── History/Favorites/Settings use cases

Domain layer
  ├── GeneratorDefinition
  ├── InputSchema / ValidationResult
  ├── GeneratorExecutor
  ├── TemplateRenderer
  ├── AIProvider / ProviderAdapter
  ├── OutputArtifact
  └── Error taxonomy

Infrastructure layer
  ├── Local generator implementations
  ├── Template assets and renderers
  ├── HTTP client and provider adapters
  ├── SQLite/local persistence
  ├── Secure storage adapter
  ├── Clipboard/file export
  └── Network status adapter
```

### 14.1 Batas dependensi

- UI tidak boleh memanggil HTTP client secara langsung.
- Generator tidak boleh mengakses secure storage secara langsung.
- Provider adapter tidak boleh mengetahui detail form UI.
- History repository tidak boleh menyimpan secret.
- Generator yang local/template tidak boleh mengimpor AI client.
- Semua external side effect melewati interface yang dapat di-mock.

### 14.2 Struktur direktori contoh

```text
lib/
├── app/
│   ├── routing/
│   ├── theme/
│   └── bootstrap/
├── core/
│   ├── errors/
│   ├── result/
│   ├── validation/
│   ├── storage/
│   └── security/
├── features/
│   ├── home/
│   ├── generators/
│   │   ├── local/
│   │   ├── template/
│   │   └── ai/
│   ├── history/
│   └── settings/
├── modules/
│   ├── registry/
│   ├── contracts/
│   └── built_in/
└── integrations/
    ├── ai_providers/
    ├── http/
    ├── secure_storage/
    └── file_export/
```

### 14.3 Saran teknis tambahan

- Gunakan schema-driven form agar generator baru tidak memerlukan komponen form khusus setiap kali.
- Gunakan immutable domain models bila framework mendukung.
- Pisahkan `GeneratorRun` dari `GeneratorDefinition` agar history dan analytics lokal tidak mengubah definisi modul.
- Sediakan fake provider dan fake clock untuk pengujian.
- Semua generator built-in harus memiliki unit test dan fixture output.
- HTTP client memiliki timeout, cancellation, redaction, dan mapping error terpusat.

## 15. Data model

### 15.1 GeneratorDefinition

| Field | Tipe | Keterangan |
|---|---|---|
| id | string | ID stabil, unik, lowercase dengan namespace |
| kind | enum | `local`, `template`, `ai` |
| name | string | Nama yang ditampilkan |
| description | string | Deskripsi singkat |
| category | string | Kategori navigasi |
| tags | list<string> | Search/filter |
| version | string | Versi kontrak modul |
| inputSchema | object | Schema input |
| outputTypes | list<enum> | plain text, Markdown, JSON, dll. |
| capabilities | object | copy, download, streaming, offline |
| executorRef | string | Referensi executor internal/plugin |
| enabled | boolean | Status modul |

### 15.2 GeneratorRun

| Field | Tipe | Keterangan |
|---|---|---|
| id | string | ID run |
| generatorId | string | Referensi generator |
| generatorVersion | string | Versi saat run |
| kind | enum | Jenis generator |
| inputSnapshot | object/null | Hanya jika history diaktifkan |
| outputArtifactId | string/null | Referensi output |
| providerId | string/null | Hanya untuk AI |
| model | string/null | Hanya untuk AI |
| status | enum | running, success, failed, cancelled |
| errorCode | string/null | Error terstruktur |
| createdAt | datetime | Waktu mulai |
| completedAt | datetime/null | Waktu selesai |

### 15.3 OutputArtifact

| Field | Tipe | Keterangan |
|---|---|---|
| id | string | ID output |
| mimeType | string | Tipe output |
| format | string | markdown, json, csv, png, dll. |
| content | text/blob | Dapat dipisah ke file lokal untuk output besar |
| sizeBytes | integer | Ukuran |
| checksum | string/null | Opsional untuk verifikasi |
| createdAt | datetime | Waktu dibuat |

### 15.4 AIProviderConfig

| Field | Tipe | Keterangan |
|---|---|---|
| id | string | ID konfigurasi |
| displayName | string | Label lokal |
| type | enum | `openai-compatible` pada MVP |
| baseUrl | string | Tanpa API key |
| model | string | Model default |
| apiKeyRef | string | Reference secure storage |
| timeoutMs | integer | Batas request |
| generationDefaults | object | temperature, max tokens, dll. |
| isDefault | boolean | Provider default |
| lastTestedAt | datetime/null | Metadata lokal |
| lastTestStatus | enum/null | success/failed/unknown |

### 15.5 AppSettings

```json
{
  "theme": "system",
  "defaultOutputFormat": "markdown",
  "historyEnabled": true,
  "saveAiContentToHistory": false,
  "showAiDataBoundaryNotice": true,
  "defaultProviderId": "provider-id-or-null",
  "favorites": ["local.json-formatter", "template.daily-report"]
}
```

### 15.6 Penyimpanan

Rekomendasi MVP:

- SQLite atau storage terstruktur setara untuk metadata, preferences, history, dan module registry;
- secure storage platform untuk API key;
- filesystem melalui file picker untuk output yang diunduh;
- migration version agar perubahan schema dapat dilakukan tanpa menghapus data pengguna.

## 16. Plugin/module generator concept

### 16.1 Tujuan

Generator harus diperlakukan sebagai modul dengan kontrak umum. Pada MVP, seluruh modul dapat dibundel sebagai built-in module. Kontrak yang sama menjadi fondasi untuk custom module dan plugin di masa depan.

### 16.2 Generator contract

```text
GeneratorModule
├── definition: GeneratorDefinition
├── validate(input): ValidationResult
├── execute(input, context): GeneratorResult
├── supportedOutputs(): OutputType[]
└── dispose(): void (opsional)
```

`context` dapat berisi locale, timezone, clock, random source, storage capability, atau provider client sesuai izin modul. Modul local/template tidak mendapat akses AI secara implisit.

### 16.3 Manifest contoh

```json
{
  "id": "local.uuid-generator",
  "version": "1.0.0",
  "name": "UUID Generator",
  "kind": "local",
  "category": "Security & Random",
  "description": "Membuat UUID v4 secara lokal.",
  "tags": ["uuid", "guid", "random", "offline"],
  "inputSchema": {
    "fields": [
      {
        "id": "count",
        "type": "integer",
        "label": "Jumlah",
        "default": 1,
        "min": 1,
        "max": 1000
      }
    ]
  },
  "outputTypes": ["plain-text"],
  "capabilities": {
    "offline": true,
    "copy": true,
    "download": true,
    "network": false
  }
}
```

### 16.4 Lifecycle dan security

- Registry memvalidasi manifest sebelum modul aktif.
- ID dan versi harus unik.
- Modul yang gagal dimuat diisolasi dan ditandai unavailable.
- Plugin eksternal harus mendeklarasikan capability/permission seperti network, file read, file write, atau AI.
- MVP hanya mengizinkan built-in module; dynamic code execution dari sumber tidak tepercaya belum didukung.
- SDK/plugin marketplace, signing, sandboxing, compatibility policy, dan rollback masuk roadmap.

## 17. Error states dan recovery

| Kondisi | State UI | Recovery |
|---|---|---|
| Field wajib kosong | Inline validation | Isi field yang ditandai |
| JSON/YAML/CSV tidak valid | Error dekat input + lokasi bila tersedia | Perbaiki input, jangan hapus teks |
| Tidak ada provider AI | AI setup empty state | Buka Settings → Add provider |
| API key kosong | Provider error | Isi atau ganti API key |
| Base URL malformed | Inline validation | Periksa scheme, hostname, dan path |
| 401/403 | Provider auth error | Periksa credential dan akses model |
| 404 | Endpoint/model error | Periksa Base URL dan model |
| 409/422 | Request invalid | Tampilkan field/request yang perlu diperbaiki tanpa secret |
| 429 | Rate limit | Tunggu, gunakan provider lain, atau retry manual |
| Timeout | Network timeout | Retry, periksa jaringan/provider |
| Offline | Offline banner | Gunakan Local/Template atau retry nanti |
| 5xx provider | Provider unavailable | Retry manual, switch provider |
| Response malformed | Integration error | Tampilkan error aman dan simpan input untuk laporan |
| Output terlalu besar | Output limit state | Kurangi input/panjang atau download sebagai file |
| Clipboard gagal | Non-blocking warning | Pilih output lalu copy manual/download |
| Permission file ditolak | File error | Pilih lokasi lain atau periksa permission OS |
| Storage corrupt/migration gagal | Recovery screen | Backup data bila mungkin, reset app data dengan konfirmasi |
| Modul built-in gagal load | Module unavailable | Reload app, lihat detail modul, lanjutkan dengan modul lain |

Semua error domain harus memiliki:

- `code` stabil untuk logging dan test;
- `userMessage` yang aman;
- `technicalDetails` yang hanya ditampilkan jika debug mode diaktifkan;
- `retryable` boolean;
- `fieldId` opsional;
- `cause` internal yang tidak langsung dirender ke UI.

## 18. Acceptance criteria MVP

### 18.1 Kriteria produk

- Pengguna dapat membuka WorkGen dan menjalankan minimal 10 Local Generator tanpa login, API key, atau internet.
- Pengguna dapat membuat Daily Report, Weekly Report, Meeting Minutes, Business Email, SOP sederhana, dan Invoice sederhana tanpa AI.
- Pengguna dapat mencari generator berdasarkan nama atau tag.
- Semua generator MVP memiliki validasi, loading/success/error state, Reset, dan Copy.
- Hasil generator dapat diedit sebelum disalin atau diunduh.
- Aplikasi tidak mengirim input Local/Template ke network.
- AI Generator menolak eksekusi jika provider/model/API key belum tersedia dan mengarahkan pengguna ke Settings.
- Pengguna dapat menambah provider `openai-compatible` dengan Display name, Base URL, API key, dan model.
- Pengguna dapat menjalankan Test connection dan mendapat status yang dapat ditindaklanjuti.
- Pengguna dapat memilih provider default dan mengganti provider per request jika fitur override tersedia.
- Custom Base URL tidak menghasilkan endpoint ganda seperti `/v1/v1`.
- API key disimpan di secure storage dan tidak muncul di log, history, atau error UI.
- Penggunaan AI menampilkan provider/model dan data boundary sebelum request dikirim.
- Saat request AI gagal, input tidak hilang dan pengguna dapat Retry.
- Local/Template tetap dapat digunakan ketika offline.
- Pengguna dapat menghapus history dan mematikan penyimpanan input/output AI.

### 18.2 Kriteria engineering

- Domain logic Local dan Template dapat diuji tanpa widget/UI atau network.
- Provider adapter dapat diuji dengan fake HTTP server.
- Setiap generator built-in memiliki fixture untuk input valid, input invalid, dan output minimum.
- Migration storage memiliki test dari schema lama ke schema terbaru.
- Error mapping mencakup sekurang-kurangnya validation, offline, timeout, 401/403, 404, 429, 5xx, dan malformed response.
- Tidak ada secret dalam output debug test atau snapshot.
- Aplikasi tidak crash ketika satu modul gagal register.
- Automated tests mencakup mode offline dan request cancellation jika platform mendukungnya.

### 18.3 Definition of done per generator

Generator dianggap siap ketika:

1. manifest/definition lengkap;
2. input schema dan validasi tersedia;
3. executor/renderer memiliki unit test;
4. output preview dan Copy bekerja;
5. error utama memiliki pesan yang dapat ditindaklanjuti;
6. metadata search/category/tags tersedia;
7. privacy/network capability sudah dideklarasikan;
8. UI diuji pada state kosong, valid, loading, success, dan error.

## 19. Milestones

Estimasi berikut mengasumsikan tim kecil yang mengerjakan aplikasi cross-platform dan dapat disesuaikan setelah platform utama dipilih.

### M0 — Product/technical foundation

**Durasi indikatif:** 3–5 hari

- tetapkan platform target dan framework;
- finalisasi kontrak module, schema, result, dan error;
- buat design tokens dan app shell wireframe;
- pilih storage, secure storage, HTTP client, dan test strategy.

**Exit criteria:** kontrak domain disetujui dan satu dummy generator dapat dirender end-to-end.

### M1 — Shell dan local engine

**Durasi indikatif:** 1–2 minggu

- Home, sidebar, kategori, search, generator detail;
- registry dan schema-driven form;
- persistence preferences/favorites;
- Copy/Download/Reset;
- 8–12 Local Generator awal;
- offline test dasar.

**Exit criteria:** pengguna dapat menjalankan Local Generator tanpa network dan tanpa konfigurasi eksternal.

### M2 — Template engine

**Durasi indikatif:** 1–2 minggu

- template schema dan renderer;
- Daily Report, Weekly Report, Meeting Minutes, Business Email;
- SOP dan Invoice sederhana jika kapasitas cukup;
- Markdown/plain text/HTML output;
- fixture dan golden tests untuk output.

**Exit criteria:** template dapat menghasilkan output konsisten dan seluruh alur tidak memanggil AI.

### M3 — Provider settings dan AI foundation

**Durasi indikatif:** 1–2 minggu

- provider CRUD;
- secure API key storage;
- openai-compatible adapter;
- Base URL, model, timeout, test connection;
- error mapping, masking, dan data boundary notice.

**Exit criteria:** provider valid dapat diuji dan error credential/network tampil dengan aman.

### M4 — AI generators dan history

**Durasi indikatif:** 1–2 minggu

- Freeform Text, Rewrite, Summarizer;
- Command Generator dan helper SQL/formula bila adapter stabil;
- cancel/retry/regenerate;
- history opt-in/opt-out dan cleanup;
- provider override per request.

**Exit criteria:** pengguna dapat memakai AI secara eksplisit tanpa merusak alur offline.

### M5 — Hardening dan beta

**Durasi indikatif:** 1–2 minggu

- accessibility pass;
- performance dan output size limits;
- migration/recovery test;
- packaging/install/update;
- privacy/security review;
- user acceptance test dengan persona administrasi dan teknis.

**Exit criteria:** MVP dapat dirilis sebagai beta dengan daftar known issues yang terdokumentasi.

## 20. Future roadmap

### Fase 1 — Personalization

- custom template builder berbasis form;
- template variables dan reusable snippets;
- import/export template tanpa secret;
- folder/tag untuk generator dan history;
- lebih banyak format export: PDF, DOCX, XLSX.

### Fase 2 — Developer and file productivity

- file/folder structure generator;
- batch rename preview;
- `.env`, JSON Schema, YAML, SQL, regex, PowerShell, dan project scaffold modules;
- drag-and-drop file input dengan permission yang jelas;
- CLI/headless mode untuk pipeline lokal.

### Fase 3 — Provider ecosystem and local AI

- adapter provider non-OpenAI-compatible;
- Ollama atau model lokal;
- provider health, usage estimate, dan per-generator defaults;
- prompt preset versioning;
- structured output/schema enforcement.

### Fase 4 — Plugin platform

- SDK dan CLI untuk membuat module;
- plugin package format dan manifest validation;
- permission model/sandbox;
- signing, verification, compatibility checks, dan rollback;
- private plugin registry atau marketplace.

### Fase 5 — Collaboration and automation

- optional account dan sync terenkripsi;
- shared templates/workspaces;
- approval flow untuk output AI;
- automation/scheduled generation;
- team policy untuk provider dan data boundary.

## 21. Open questions

1. Platform utama MVP: Windows desktop saja, Windows/macOS/Linux, mobile, atau web?
2. Framework yang akan digunakan: Flutter, Tauri, Electron, atau pilihan lain?
3. Apakah request AI dikirim langsung dari client, atau melalui backend/proxy milik WorkGen?
4. Apakah OpenAI-compatible cukup untuk MVP, atau perlu adapter resmi provider tertentu sejak awal?
5. Apakah API key boleh disimpan lokal pada device shared, atau perlu master password?
6. Apakah history aktif secara default untuk output biasa dan nonaktif secara default untuk AI?
7. Format output mana yang wajib di MVP: Markdown, plain text, JSON/CSV, HTML, PDF, DOCX, atau XLSX?
8. Apakah Invoice harus memiliki aturan pajak/format lokal tertentu, misalnya Indonesia?
9. Apakah pengguna dapat mendefinisikan template sendiri pada MVP atau cukup built-in template?
10. Apakah QR code, hash file, dan operasi file perlu masuk MVP atau fase local generator berikutnya?
11. Apakah aplikasi memerlukan dukungan locale dan timezone multi-bahasa sejak awal?
12. Apakah akan ada telemetry opt-in untuk mengetahui generator populer tanpa mengumpulkan isi input/output?
13. Apa kebijakan lisensi dan distribusi untuk module pihak ketiga?
14. Apakah custom Base URL harus dibatasi melalui allowlist pada versi enterprise?
15. Bagaimana pengguna akan melaporkan bug provider tanpa membocorkan request dan API key?

## 22. Risiko dan mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Scope terlalu luas karena banyak generator | MVP terlambat dan kualitas tidak merata | Bekukan daftar MVP, gunakan kontrak modul, tambah generator setelah baseline stabil |
| Ketergantungan pada variasi provider AI | Test connection/request tidak konsisten | Adapter capability, fake server, error mapping, dokumentasi provider yang didukung |
| API key bocor melalui log/history | Risiko keamanan tinggi | Secure storage, redaction terpusat, secret test, review sebelum beta |
| Pengguna mengira output AI selalu benar | Keputusan atau dokumen keliru | Label hasil AI, review notice, tidak ada eksekusi otomatis |
| Custom endpoint berbahaya | Data terkirim ke host tidak diharapkan | Host notice, HTTPS, redirect checks, tidak ada TLS bypass, allowlist future |
| Storage rusak atau schema berubah | Data/history hilang | Migration, backup/export, recovery screen, destructive reset dengan konfirmasi |
| UI terlalu kompleks | Adopsi rendah | Progressive disclosure, form sederhana, search dan recent tools |
| Local dan template diam-diam memerlukan network | Janji local-first gagal | Capability declaration, network spy test, CI offline test |

## 23. Contoh user stories

### Local Generator

> Sebagai developer, saya ingin memformat JSON secara lokal agar dapat memeriksa konfigurasi tanpa mengirim data internal ke layanan eksternal.

### Template Generator

> Sebagai staf operasional, saya ingin mengisi form daily report dan mendapatkan format Markdown konsisten agar laporan dapat dikirim lebih cepat.

### AI Provider

> Sebagai pengguna yang memiliki API key sendiri, saya ingin memasukkan Base URL, API key, dan model agar saya dapat memakai provider yang saya pilih.

### Privacy

> Sebagai pengguna, saya ingin diberi tahu kapan isi pekerjaan akan dikirim ke provider AI agar saya dapat menghapus atau mengganti data sensitif sebelum mengirimnya.

### Offline

> Sebagai pengguna laptop, saya ingin tetap memakai generator lokal dan template saat tidak ada internet agar pekerjaan rutin tidak berhenti.

## 24. Ringkasan keputusan produk

WorkGen harus dibangun sebagai produk produktivitas **hybrid dan local-first**. Local Generator dan Template Generator adalah nilai inti yang membuat aplikasi berguna tanpa AI. AI Generator menyediakan kemampuan tambahan yang dikontrol pengguna melalui provider settings, termasuk dukungan OpenAI-compatible dengan custom Base URL, API key, model, dan Test connection.

Urutan pengembangan yang direkomendasikan adalah:

```text
App shell
  → Local engine
  → Template engine
  → Provider settings + secure storage
  → AI generators
  → History/privacy hardening
  → Plugin SDK dan roadmap lanjutan
```

Keputusan ini menjaga MVP tetap dapat digunakan secara mandiri, memberi ruang untuk pengembangan bertahap, dan mencegah arsitektur WorkGen terikat pada satu provider AI.
