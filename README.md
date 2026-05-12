# Satranç — AI Destekli Modern Satranç Öğrenme Platformu

Modern, AI destekli, eğitici bir satranç uygulaması. Vite + React + TypeScript + Tailwind + Zustand
ile inşa edildi. Web hem de Tauri ile masaüstü .exe olarak çalışır.

## Özellikler

- **Stockfish 16 NNUE** WASM, Web Worker'da çalışır. ELO 600–3000 arası gerçek seviyede oynar
- **Gemini AI Koç** — Stockfish'in değerlendirmesini Türkçe açıklar, oyun sonu analizler verir, puzzle ipuçları üretir
- **Kişisel ELO sistemi** — standart Elo (K=32/24/16), her oyundan sonra güncellenir
- **Bulmacalar** — kademeli AI ipucu ile, ayrı puzzle ELO
- **İnteraktif dersler** — taktik, açılış, oyun sonu (markdown driven)
- **Analiz modu** — PGN/FEN yapıştır, hamleleri tara, AI koça pozisyonları açıklat
- **30+ Achievement** — oyun, puzzle, ders, ustalık, süreklilik kategorilerinde
- **i18n** — Türkçe + İngilizce toggle
- **3 tema** — Karanlık, Gece (OLED), Aydınlık
- **Yerel veritabanı** — Dexie (IndexedDB) ile, backend yok, %100 local

## Hızlı Başlangıç (Web)

```bash
npm install
npm run dev          # http://localhost:5173
```

Production build:
```bash
npm run build
npm run preview
```

## Tauri Masaüstü Uygulaması (.exe)

Tauri Rust gerektirir. Bir kerelik kurulum:

1. **Rust kur:** https://rustup.rs (sadece Windows için: `winget install Rustlang.Rustup`)
2. Yeniden başlat veya yeni terminal aç (`rustc --version` çalıştırarak doğrula)
3. Tauri'yi başlat:
   ```bash
   npx tauri init
   ```
   Sorulara:
   - App name: `Satranç`
   - Window title: `Satranç`
   - Web assets path: `../dist`
   - Dev server URL: `http://localhost:5173`
   - Frontend dev command: `npm run dev`
   - Frontend build command: `npm run build`

4. **CSP'yi WASM'a açın** — `src-tauri/tauri.conf.json` içinde:
   ```json
   "app": {
     "security": {
       "csp": "default-src 'self' data:; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://generativelanguage.googleapis.com"
     }
   }
   ```
   Bu olmadan Stockfish WASM çalışmaz.

5. Çalıştır:
   ```bash
   npm run tauri dev       # geliştirme
   npm run tauri build     # production .exe (NSIS installer)
   ```

## Proje Yapısı

```
src/
├── lib/                  # db (Dexie), elo, pgn, stockfish, achievements
├── workers/              # (gerekirse — şu an Stockfish public/'tan yükleniyor)
├── stores/               # Zustand: ai, game, profile, puzzle, achievements, settings
├── hooks/                # useStockfish, useAchievementWatcher
├── components/
│   ├── ui/               # shadcn primitives (button, card, dialog, ...)
│   ├── board/            # Chessboard (chessground wrapper), MoveList, EvalBar, PromotionDialog
│   ├── ai/               # CoachPanel, HintButton
│   └── layout/           # Sidebar, TopBar, MobileNav, AppLayout
├── pages/                # Home, Play, Puzzles, Lessons, Analysis, Profile, Settings
├── i18n/                 # i18next + locales/tr.json, locales/en.json
├── types/                # chess.d.ts
└── main.tsx, App.tsx
public/
├── stockfish/            # Stockfish WASM (node_modules/stockfish/src/ → kopya)
└── puzzles-seed.json     # ~40 başlangıç bulmaca; ilk açılışta Dexie'ye yüklenir
```

## Mimari — Kritik Karar

**Gemini satranç oynayamaz.** Stockfish ground truth verir, Gemini sadece **anlatıcı**.

Her Gemini çağrısı şu desenle yapılır:
```
FEN: <pozisyon>
Oyuncu hamlesi: Nf3 (eval düştü: +0.4 → -1.2, blunder)
Stockfish en iyi: Nxe5 (eval: +1.8, PV: Nxe5 Qf6 d4)
Görev: Türkçe 2-3 cümlede neden Nf3'ün kötü olduğunu açıkla.
Kural: ASLA yasadışı hamle önerme. Stockfish'in eval'ini doğru kabul et.
```

Bu desen halüsinasyonu sıfırlar — Gemini sadece yorumlar, asla karar vermez.

## Gemini API Keys

`.env` dosyası 13 key ile birlikte gelir (Relay projesinden taşındı). Key rotation otomatik:
rate limit (429) gelirse bir sonraki key'e geçer. `VITE_GEMINI_API_KEY_1..13`.

## Geliştirme Notları

- **Stockfish singleton:** `src/hooks/useStockfish.ts` tek bir worker'ı tüm app'e paylaştırır
- **Persistence ayrımı:**
  - localStorage (Zustand persist): settings, profile snapshot
  - IndexedDB (Dexie): oyun geçmişi, puzzle ilerleme, achievement kayıtları
- **Vite chunking:** `vite.config.ts`'de manuel chunk split (react, ui, chess, i18n, db)
- **Type safety:** `tsconfig.app.json` strict, `noUnusedLocals` ve `noUnusedParameters` esnek (geliştirme rahatlığı için)

## Lisans

MIT
