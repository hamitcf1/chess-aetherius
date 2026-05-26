import { motion, type Variants } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
    Brain, Swords, Crown, Target, GraduationCap, LineChart, Trophy,
    Globe, Zap, Cloud, Sparkles, ArrowRight, Check, X, ChevronDown, Play,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { useAuthStore } from '@/stores/authStore'

const STAGGER: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
}

const FADE_UP: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
}

const STRUCTURED_DATA = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'ChessAetherius',
    operatingSystem: 'Web',
    applicationCategory: 'GameApplication',
    description: 'AI-powered chess learning platform with Stockfish 16 and Gemini AI coach.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
}

export function LandingPage() {
    const navigate = useNavigate()
    const user = useAuthStore(s => s.user)
    const initialized = useAuthStore(s => s.initialized)

    useEffect(() => {
        if (initialized && user) navigate('/app')
    }, [user, initialized, navigate])

    return (
        <PublicLayout>
            <script type="application/ld+json">{JSON.stringify(STRUCTURED_DATA)}</script>
            <HeroSection navigate={navigate} />
            <StatsSection />
            <FeatureGrid />
            <DeepDive />
            <ComparisonSection />
            <FaqSection />
            <FinalCta navigate={navigate} />
        </PublicLayout>
    )
}

// ────────────────────────────────────────────────────────────────────────────
// HERO
// ────────────────────────────────────────────────────────────────────────────

function HeroSection({ navigate }: { navigate: any }) {
    return (
        <section className="relative pt-32 pb-24 md:pt-40 md:pb-32 px-4 overflow-hidden">
            <div className="absolute inset-0 -z-10">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[700px] bg-gradient-radial from-primary/25 via-purple-500/10 to-transparent blur-3xl" />
                <div className="absolute top-1/3 left-[10%] w-[400px] h-[400px] bg-blue-500/15 rounded-full blur-[100px]" />
                <div className="absolute top-1/2 right-[10%] w-[400px] h-[400px] bg-purple-500/15 rounded-full blur-[100px]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,transparent_50%,rgb(0_0_0/0.4)_100%)]" />
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
                        backgroundSize: '60px 60px',
                        maskImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, black 30%, transparent 70%)'
                    }}
                />
            </div>

            <div className="relative max-w-6xl mx-auto text-center">
                <motion.div
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                    className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-zinc-300 backdrop-blur-sm"
                >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
                    Stockfish 16 NNUE + Gemini AI Koç
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}
                    className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-white mb-6 leading-[1.02]"
                >
                    Satrançta gerçek
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-pink-400">
                        bir oyuncu ol.
                    </span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-10"
                >
                    Dünyanın en güçlü motoru Stockfish'e karşı oyna. Gemini AI koç her hamleni Türkçe açıklar.
                    ELO, bulmacalar, dersler ve başarımlar — sıfırdan ustalığa giden yolun arkadaşı.
                </motion.p>

                <motion.nav
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16"
                >
                    <Button
                        size="lg"
                        onClick={() => navigate('/login')}
                        className="h-12 px-6 bg-white text-black hover:bg-zinc-200 rounded-full active:scale-[0.98] transition-transform group"
                    >
                        Ücretsiz Başla
                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                    </Button>
                    <Button
                        size="lg" variant="outline"
                        onClick={() => navigate('/app')}
                        className="h-12 px-6 border-white/15 text-white hover:bg-white/5 rounded-full active:scale-[0.98] transition-transform"
                    >
                        <Play className="w-4 h-4 mr-1" aria-hidden="true" /> Misafir Olarak Dene
                    </Button>
                </motion.nav>

                {/* Product preview */}
                <motion.div
                    initial={{ opacity: 0, y: 40, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="relative max-w-5xl mx-auto"
                >
                    <ProductMockup />
                </motion.div>
            </div>
        </section>
    )
}

function ProductMockup() {
    return (
        <div className="relative rounded-2xl border border-white/10 bg-zinc-950/80 backdrop-blur-md shadow-[0_30px_80px_-20px_rgba(124,58,237,0.4)] overflow-hidden">
            <div className="flex items-center gap-1.5 px-4 h-9 border-b border-white/10 bg-zinc-900/60">
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                <div className="ml-4 px-3 py-1 rounded-md bg-zinc-800/60 text-[10px] text-zinc-400 font-mono">
                    chess.hamitcf.info/app/play
                </div>
            </div>

            <div className="grid grid-cols-12 min-h-[420px]">
                {/* Sidebar */}
                <div className="col-span-2 border-r border-white/10 p-3 space-y-1 hidden md:block bg-zinc-950/50">
                    <div className="h-7 px-2 flex items-center gap-2 rounded-md bg-primary/10 text-primary">
                        <Swords className="w-3.5 h-3.5" aria-hidden="true" />
                        <span className="text-xs font-medium">Oyna</span>
                    </div>
                    {[Target, GraduationCap, LineChart, Trophy, Crown].map((Icon, i) => (
                        <div key={i} className="h-7 px-2 flex items-center gap-2 rounded-md text-zinc-500">
                            <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                            <span className="text-xs">·····</span>
                        </div>
                    ))}
                </div>

                {/* Main: mini board mockup */}
                <div className="col-span-12 md:col-span-10 p-4 md:p-6 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="px-2.5 py-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Sıra sende
                            </div>
                            <div className="px-2.5 py-1 rounded-md border border-white/10 bg-white/5 text-zinc-300 text-[10px] font-mono">
                                10:00
                            </div>
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono">
                            ELO <span className="text-white font-bold">1200</span>
                        </div>
                    </div>

                    <MiniBoard />

                    <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                        <Sparkles className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                        <span className="text-[10px] text-zinc-400">Stockfish düşünüyor… <span className="text-primary font-mono">+0.4 depth 18</span></span>
                    </div>
                </div>
            </div>

            <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-b from-white/10 via-transparent to-transparent" />
        </div>
    )
}

function MiniBoard() {
    // Simple 8x8 grid with starting pieces in unicode
    const ranks = ['♜♞♝♛♚♝♞♜', '♟♟♟♟♟♟♟♟', '', '', '', '', '♙♙♙♙♙♙♙♙', '♖♘♗♕♔♗♘♖']
    return (
        <div className="aspect-square w-full max-w-xs mx-auto rounded-lg overflow-hidden border border-white/10 shadow-lg">
            {ranks.map((r, ri) => (
                <div key={ri} className="grid grid-cols-8" style={{ height: '12.5%' }}>
                    {Array.from({ length: 8 }).map((_, fi) => {
                        const isLight = (ri + fi) % 2 === 0
                        const piece = r[fi] || ''
                        const isLastMove = (ri === 6 && fi === 4) || (ri === 4 && fi === 4)
                        return (
                            <div
                                key={fi}
                                className={`flex items-center justify-center text-base sm:text-xl ${isLight ? 'bg-[#ebecd0]' : 'bg-[#779556]'} ${isLastMove ? 'ring-2 ring-amber-400 ring-inset' : ''}`}
                                style={{ color: ri < 2 ? '#0a0a0a' : '#fafafa', WebkitTextStroke: ri < 2 ? '0.5px #444' : '0.5px #aaa' }}
                            >
                                {/* Place pawn at e4 for last-move highlight visual */}
                                {ri === 4 && fi === 4 ? <span style={{ color: '#fafafa', WebkitTextStroke: '0.5px #aaa' }}>♙</span> : piece}
                            </div>
                        )
                    })}
                </div>
            ))}
        </div>
    )
}

// ────────────────────────────────────────────────────────────────────────────
// STATS
// ────────────────────────────────────────────────────────────────────────────

function StatsSection() {
    const stats = [
        { value: '11', label: 'Zorluk', desc: '200-3000 ELO arası AI seviyesi' },
        { value: '24', label: 'Ders', desc: 'Açılış, taktik, oyun sonu, strateji' },
        { value: '∞', label: 'Bulmaca', desc: 'Doğrulanmış mate-in-X ve taktik' },
        { value: '2', label: 'Dil', desc: 'Türkçe + İngilizce desteği' },
    ]
    return (
        <section className="relative py-16 border-y border-white/5 bg-zinc-950/40">
            <div className="container mx-auto px-6">
                <motion.div
                    initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={STAGGER}
                    className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto"
                >
                    {stats.map((s, i) => (
                        <motion.div key={i} variants={FADE_UP} className="text-center">
                            <div className="flex items-baseline justify-center gap-1 mb-2">
                                <span className="text-3xl md:text-4xl font-bold text-white tracking-tight tabular-nums">{s.value}</span>
                                <span className="text-sm text-zinc-500 font-medium">{s.label}</span>
                            </div>
                            <p className="text-xs text-zinc-500">{s.desc}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    )
}

// ────────────────────────────────────────────────────────────────────────────
// FEATURE GRID
// ────────────────────────────────────────────────────────────────────────────

function FeatureGrid() {
    const features = [
        { icon: Brain, color: 'text-blue-400', title: 'AI Koç', desc: 'Gemini her hamleni Türkçe açıklar. Stockfish ground truth, Gemini anlatıcı.' },
        { icon: Swords, color: 'text-emerald-400', title: 'Stockfish 16 NNUE', desc: 'Dünyanın en güçlü motoru, tarayıcında. 11 zorluk seviyesi.' },
        { icon: Target, color: 'text-purple-400', title: 'Bulmacalar', desc: 'Doğrulanmış taktik puzzleları + ayrı puzzle ELO sistemi.' },
        { icon: GraduationCap, color: 'text-pink-400', title: 'İnteraktif Dersler', desc: '24 ders. Açılış, taktik, oyun sonu — her adımda hamle yap.' },
        { icon: LineChart, color: 'text-orange-400', title: 'Detaylı Analiz', desc: 'Geçmiş oyunlarını hamle hamle incele. Kısa/Detaylı/Kritik mod.' },
        { icon: Trophy, color: 'text-amber-400', title: '28+ Başarım', desc: 'İlk zafer, mate-in-X, streak, açılış ustalığı — confetti ile.' },
        { icon: Zap, color: 'text-yellow-400', title: 'Canlı ELO', desc: 'Chess.com tarzı otomatik eşleştirme. Senin seviyene yakın rakipler.' },
        { icon: Cloud, color: 'text-cyan-400', title: 'Bulut Senkron', desc: 'Firebase ile profil, oyun, başarımlar her cihazda senkron.' },
        { icon: Globe, color: 'text-red-400', title: 'TR + EN', desc: 'Tam çift dilli arayüz. Gemini cevapları da seçili dilde.' },
    ]

    return (
        <section id="features" className="py-24 bg-zinc-950">
            <div className="container mx-auto px-6">
                <motion.header
                    initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={FADE_UP}
                    className="text-center mb-12 max-w-2xl mx-auto"
                >
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">Senin için her şey burada</h2>
                    <p className="text-zinc-400">Sıfırdan ustalığa giden yolda her aşamada yanında</p>
                </motion.header>

                <motion.div
                    initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={STAGGER}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto"
                >
                    {features.map((f, i) => {
                        const Icon = f.icon
                        return (
                            <motion.div key={i} variants={FADE_UP} className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/80 transition-colors group">
                                <div className="mb-4 p-2.5 rounded-lg bg-zinc-900 w-fit border border-zinc-800 group-hover:border-zinc-700 transition-colors">
                                    <Icon className={`w-5 h-5 ${f.color}`} aria-hidden="true" />
                                </div>
                                <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
                                <p className="text-zinc-400 leading-relaxed text-sm">{f.desc}</p>
                            </motion.div>
                        )
                    })}
                </motion.div>
            </div>
        </section>
    )
}

// ────────────────────────────────────────────────────────────────────────────
// DEEP-DIVE
// ────────────────────────────────────────────────────────────────────────────

function DeepDive() {
    const sections = [
        {
            tag: 'AI KOÇ',
            title: 'Hatalarını anla, tekrarlama.',
            desc: 'Her oyun sonunda Stockfish her hamleyi derinlemesine analiz eder. Gemini bu analizleri Türkçe açıklar. Sadece "yanlış" değil, NEDEN yanlış olduğunu öğrenirsin.',
            bullets: ['Hamle başına cp-loss analizi', 'Blunder/Mistake/Inaccuracy sınıflandırması', 'Kısa, Normal, Detaylı, sadece-Kritik mod'],
            visual: <CoachVisual />,
        },
        {
            tag: 'OYNA',
            title: 'Senin seviyene karşı, anında.',
            desc: 'Chess.com tarzı otomatik eşleştirme. AI senin ELO\'na ±100 yakın eşleşir. Kazandıkça AI de güçlenir. 11 zorluk + 10 zaman seçeneği.',
            bullets: ['200 ELO başlangıçtan 3000\'e', 'Stockfish skill 0-20 + UCI_LimitStrength', 'Saat: 1+0\'dan 30+0\'a 10 tempo'],
            visual: <PlayVisual />,
        },
        {
            tag: 'ANALİZ',
            title: 'Geçmişten ders çıkar.',
            desc: 'Tüm oyunların yerel + Firestore\'da. Geri-ileri sar, varyantları dene, klavye ile gez. Hangi hamlede ne yaptın, ne yapmalıydın — hepsi orada.',
            bullets: ['← → ile hamle gezme, F ile çevir', 'Keşif modu: kendi varyantını dene', 'Stockfish canlı eval bar + PV gösterimi'],
            visual: <AnalysisVisual />,
        },
    ]

    return (
        <section id="how" className="py-24 border-t border-white/5">
            <div className="container mx-auto px-6 space-y-24 max-w-6xl">
                {sections.map((s, i) => (
                    <motion.div
                        key={i}
                        initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} variants={STAGGER}
                        className={`grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center ${i % 2 === 1 ? 'lg:[&>*:first-child]:order-last' : ''}`}
                    >
                        <motion.div variants={FADE_UP}>
                            <div className="inline-block px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
                                {s.tag}
                            </div>
                            <h3 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4 leading-tight">{s.title}</h3>
                            <p className="text-zinc-400 text-base leading-relaxed mb-6">{s.desc}</p>
                            <ul className="space-y-2.5">
                                {s.bullets.map((b, j) => (
                                    <li key={j} className="flex items-start gap-2.5 text-sm text-zinc-300">
                                        <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" aria-hidden="true" />
                                        <span>{b}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                        <motion.div variants={FADE_UP}>{s.visual}</motion.div>
                    </motion.div>
                ))}
            </div>
        </section>
    )
}

function CoachVisual() {
    return (
        <div className="relative aspect-[4/3] rounded-2xl border border-white/10 bg-zinc-950 overflow-hidden p-6">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
            <div className="relative h-full flex flex-col gap-2">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1">Oyun Sonu Analizi</div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="rounded-md bg-rose-500/10 border border-rose-500/20 p-2 text-center">
                        <div className="text-2xl font-bold text-rose-400 tabular-nums">3</div>
                        <div className="text-[9px] text-zinc-500 uppercase tracking-wider">Hata</div>
                    </div>
                    <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-2 text-center">
                        <div className="text-2xl font-bold text-amber-400 tabular-nums">5</div>
                        <div className="text-[9px] text-zinc-500 uppercase tracking-wider">Yanlışlık</div>
                    </div>
                    <div className="rounded-md bg-emerald-500/10 border border-emerald-500/20 p-2 text-center">
                        <div className="text-2xl font-bold text-emerald-400 tabular-nums">22</div>
                        <div className="text-[9px] text-zinc-500 uppercase tracking-wider">İyi</div>
                    </div>
                </div>
                <div className="rounded-lg bg-white/[0.03] border border-white/5 p-3 flex-1">
                    <div className="flex items-center gap-1.5 mb-2">
                        <Sparkles className="w-3 h-3 text-primary" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">AI Koç</span>
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-relaxed">
                        "12. Nxe4 ciddi bir <span className="text-rose-400 font-semibold">blunder</span>. At'ı verdin, karşılığında piyon aldın. Nxd5 ile vezir kanadına baskı kurmalıydın..."
                    </p>
                </div>
            </div>
        </div>
    )
}

function PlayVisual() {
    return (
        <div className="relative aspect-[4/3] rounded-2xl border border-white/10 bg-zinc-950 overflow-hidden p-6 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent" />
            <div className="relative flex flex-col items-center w-full max-w-xs">
                <div className="w-full mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-white text-zinc-900 flex items-center justify-center text-sm font-bold">♔</div>
                        <div>
                            <div className="text-xs text-white font-medium">Sen</div>
                            <div className="text-[10px] text-zinc-500">ELO 1450</div>
                        </div>
                    </div>
                    <div className="text-[10px] font-mono bg-primary/20 text-primary px-2 py-0.5 rounded">8:42</div>
                </div>
                <div className="aspect-square w-full rounded-md bg-gradient-to-br from-[#779556] to-[#ebecd0] flex items-center justify-center text-zinc-700 text-3xl font-bold opacity-80">
                    ♔♚
                </div>
                <div className="w-full mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white border border-border flex items-center justify-center text-sm font-bold">♚</div>
                        <div>
                            <div className="text-xs text-white font-medium">Stockfish AI</div>
                            <div className="text-[10px] text-zinc-500">ELO 1500</div>
                        </div>
                    </div>
                    <div className="text-[10px] font-mono bg-muted text-zinc-400 px-2 py-0.5 rounded">9:55</div>
                </div>
            </div>
        </div>
    )
}

function AnalysisVisual() {
    const bars = [60, 62, 58, 55, 75, 70, 65, 30, 32, 28, 25, 50]
    return (
        <div className="relative aspect-[4/3] rounded-2xl border border-white/10 bg-zinc-950 overflow-hidden p-6">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent" />
            <div className="relative h-full flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Eval Grafiği</div>
                    <div className="text-[10px] text-zinc-400 font-mono">depth 18</div>
                </div>
                <div className="flex items-end gap-1 h-32">
                    {bars.map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col-reverse">
                            <div
                                className={`rounded-t-sm ${h > 50 ? 'bg-emerald-500/60' : 'bg-rose-500/60'} transition-all`}
                                style={{ height: `${Math.abs(h - 50) * 2 + 10}%` }}
                            />
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-6 gap-1 text-[9px] font-mono">
                    {['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6', '?', 'Nxd4', '??', 'cxd4', '?!', 'd5'].map((m, i) => (
                        <div key={i} className={`px-1 py-0.5 rounded text-center ${m.includes('?') ? 'bg-rose-500/20 text-rose-400' : 'bg-white/5 text-zinc-300'}`}>{m}</div>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ────────────────────────────────────────────────────────────────────────────
// COMPARISON
// ────────────────────────────────────────────────────────────────────────────

function ComparisonSection() {
    return (
        <section className="py-24 border-t border-white/5 bg-zinc-950">
            <div className="container mx-auto px-6 max-w-5xl">
                <motion.header
                    initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={FADE_UP}
                    className="text-center mb-12 max-w-2xl mx-auto"
                >
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">Farkı gör.</h2>
                    <p className="text-zinc-400">Sıradan satranç uygulaması vs ChessAetherius</p>
                </motion.header>

                <motion.div
                    initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={STAGGER}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                    <motion.div variants={FADE_UP} className="p-6 rounded-xl bg-zinc-900/30 border border-zinc-800">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 mb-4">Diğer uygulamalar</h3>
                        <ul className="space-y-3">
                            {['Sadece "kazandın/kaybettin" — neden bilinmiyor', 'Ders içerikleri pahalı abonelik arkasında', 'AI motoru yetersiz veya çevrim içi gerekiyor', 'İngilizce ağırlıklı, Türkçe destek zayıf'].map((item, i) => (
                                <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-400">
                                    <X className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" aria-hidden="true" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    <motion.div variants={FADE_UP} className="p-6 rounded-xl bg-primary/5 border border-primary/20 relative overflow-hidden">
                        <div className="absolute -top-12 -right-12 w-40 h-40 bg-primary/15 rounded-full blur-2xl" aria-hidden="true" />
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-primary mb-4 relative">ChessAetherius</h3>
                        <ul className="space-y-3 relative">
                            {['Her hamlene Türkçe açıklama: NE ve NEDEN', 'Tüm ders, bulmaca, analiz — tamamen ücretsiz', 'Stockfish 16 NNUE tarayıcıda, çevrim dışı çalışır', 'Native Türkçe + İngilizce — Gemini de iki dilde'].map((item, i) => (
                                <li key={i} className="flex items-start gap-2.5 text-sm text-white">
                                    <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" aria-hidden="true" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    )
}

// ────────────────────────────────────────────────────────────────────────────
// FAQ
// ────────────────────────────────────────────────────────────────────────────

function FaqSection() {
    const faqs = [
        { q: 'Tamamen ücretsiz mi?', a: 'Evet, ChessAetherius tamamen ücretsiz. Sınırsız oyun, sınırsız bulmaca, sınırsız AI koç. Reklam yok, paywall yok.' },
        { q: 'Hesap açmak zorunda mıyım?', a: 'Hayır. Misafir modu ile yerel olarak (IndexedDB) oynayabilirsin. Hesap açarsan ELO\'n, oyunların ve başarımların Firestore\'da yedeklenir, başka cihazda devam edebilirsin.' },
        { q: 'Stockfish gerçekten tarayıcıda çalışıyor mu?', a: 'Evet. Stockfish 16 NNUE WASM Web Worker\'da çalışır. İlk yüklemede ~600KB indirir, sonra offline.' },
        { q: 'AI koç ne kadar güvenilir?', a: 'Stockfish değerlendirmesi ground truth. Gemini sadece bu değerlendirmeyi Türkçe açıklar — yasadışı hamle önermez, çünkü Stockfish\'in çıktısını referans alır.' },
        { q: 'Verilerim güvende mi?', a: 'Tüm veriler senin hesabına bağlı, sadece sen erişebilirsin (Firestore security rules). Yerel olarak Dexie/IndexedDB\'de cache\'lenir, çevrim dışı da çalışır.' },
    ]
    return (
        <section id="faq" className="py-24 border-t border-white/5">
            <div className="container mx-auto px-6 max-w-3xl">
                <motion.header
                    initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={FADE_UP}
                    className="text-center mb-10"
                >
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">Sıkça Sorulan Sorular</h2>
                    <p className="text-zinc-400">Aklında ne var?</p>
                </motion.header>

                <motion.div
                    initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={STAGGER}
                    className="space-y-2"
                >
                    {faqs.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
                </motion.div>
            </div>
        </section>
    )
}

function FaqItem({ q, a }: { q: string; a: string }) {
    const [open, setOpen] = useState(false)
    return (
        <motion.div variants={FADE_UP} className="rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden">
            <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-5 text-left hover:bg-zinc-900/50 transition-colors" aria-expanded={open}>
                <span className="text-sm md:text-base font-medium text-white pr-4">{q}</span>
                <ChevronDown className={`w-4 h-4 text-zinc-500 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
            <motion.div initial={false} animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                <p className="px-5 pb-5 text-sm text-zinc-400 leading-relaxed">{a}</p>
            </motion.div>
        </motion.div>
    )
}

// ────────────────────────────────────────────────────────────────────────────
// FINAL CTA
// ────────────────────────────────────────────────────────────────────────────

function FinalCta({ navigate }: { navigate: any }) {
    return (
        <section className="py-24 relative overflow-hidden">
            <div className="absolute inset-0 -z-10">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/30 via-purple-500/15 to-transparent blur-3xl" />
            </div>
            <motion.div
                initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }} variants={FADE_UP}
                className="container mx-auto px-6 text-center max-w-3xl"
            >
                <div className="mb-6 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-zinc-300 backdrop-blur-sm">
                    <Sparkles className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                    Hepsi ücretsiz · Reklam yok
                </div>
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight leading-tight">
                    İlk hamleyi yapma vakti.
                </h2>
                <p className="text-lg text-zinc-400 mb-8 max-w-xl mx-auto">
                    Hesap aç veya misafir olarak başla. Stockfish ve Gemini seni bekliyor.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Button
                        size="lg" onClick={() => navigate('/login')}
                        className="h-12 px-6 bg-white text-black hover:bg-zinc-200 rounded-full active:scale-[0.98] transition-transform group"
                    >
                        Ücretsiz Başla
                        <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                    </Button>
                    <Button
                        size="lg" variant="outline" onClick={() => navigate('/app')}
                        className="h-12 px-6 border-white/15 text-white hover:bg-white/5 rounded-full active:scale-[0.98] transition-transform"
                    >
                        <Play className="w-4 h-4 mr-1" aria-hidden="true" /> Misafir Olarak Dene
                    </Button>
                </div>
            </motion.div>
        </section>
    )
}
