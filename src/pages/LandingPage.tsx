import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Crown, Swords, Brain, Trophy, Target, Sparkles, GraduationCap, LineChart, Github, ArrowRight, Zap, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function LandingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 overflow-x-hidden">
            {/* Header */}
            <header className="sticky top-0 z-40 backdrop-blur-md bg-background/60 border-b border-border/50">
                <div className="container mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
                            <Crown className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <div className="font-bold leading-none">ChessAetherius</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">AI Destekli Satranç</div>
                        </div>
                    </Link>
                    <div className="flex items-center gap-2">
                        <Button asChild variant="ghost" size="sm">
                            <Link to="/login">Giriş</Link>
                        </Button>
                        <Button asChild size="sm">
                            <Link to="/login">Başla <ArrowRight className="w-3.5 h-3.5" /></Link>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="container mx-auto max-w-6xl px-4 py-20 text-center">
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <Badge variant="accent" className="mb-6">
                        <Sparkles className="w-3 h-3 mr-1" /> Yepyeni — Stockfish 16 + Gemini AI
                    </Badge>
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-gradient-primary leading-tight">
                        Satrançta gerçek bir<br />oyuncu ol
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                        Dünyanın en güçlü satranç motoru Stockfish'e karşı oyna, Gemini AI koç ile her hamlende neyi yanlış / doğru yaptığını Türkçe öğren. ELO, bulmacalar, dersler, başarımlar — hepsi tek yerde.
                    </p>
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                        <Button asChild size="xl" className="text-base">
                            <Link to="/login"><Swords className="w-5 h-5" />Hemen Başla — Ücretsiz</Link>
                        </Button>
                        <Button asChild size="xl" variant="outline">
                            <Link to="/app"><Zap className="w-5 h-5" />Misafir Olarak Dene</Link>
                        </Button>
                    </div>
                </motion.div>
            </section>

            {/* Feature grid */}
            <section className="container mx-auto max-w-6xl px-4 py-16">
                <div className="text-center mb-10">
                    <h2 className="text-2xl md:text-3xl font-bold mb-2">Senin için her şey burada</h2>
                    <p className="text-sm text-muted-foreground">Sıfırdan ustalığa giden yolda her aşamada yanında</p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FeatureCard icon={Brain} title="AI Koç" desc="Stockfish ground-truth verir, Gemini Türkçe açıklar. Hatalarını öğrenirsin, bahane bulamazsın." color="text-primary" />
                    <FeatureCard icon={Swords} title="Stockfish 16 vs Sen" desc="ELO 200'den 3000'e kadar 11 zorluk seviyesi. Chess.com tarzı otomatik eşleştirme." color="text-accent" />
                    <FeatureCard icon={Target} title="Bulmacalar" desc="Doğrulanmış mate-in-1, taktik ve kombinasyon puzzleları. Ayrı puzzle ELO." color="text-success" />
                    <FeatureCard icon={GraduationCap} title="24 İnteraktif Ders" desc="Açılış, taktik, oyun sonu, strateji. Her ders adımında hamle yapacaksın." color="text-blue-400" />
                    <FeatureCard icon={LineChart} title="Detaylı Analiz" desc="Geçmiş oyunlarını yükle, hamle hamle Stockfish + Gemini ile incele. Kısa/Detaylı/Kritik mod." color="text-purple-400" />
                    <FeatureCard icon={Trophy} title="28 Başarım" desc="İlk zaferin, mate-in-X, streak'ler, açılış ustalığı. Confetti efektiyle açılır." color="text-amber-400" />
                </div>
            </section>

            {/* How it works */}
            <section className="container mx-auto max-w-4xl px-4 py-16">
                <div className="text-center mb-10">
                    <h2 className="text-2xl md:text-3xl font-bold mb-2">Nasıl çalışıyor?</h2>
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                    <Step n="1" title="Oyna" desc="Senin ELO'na uygun AI ile eşleş. Saat çalışır, sen hamle yaparsın." />
                    <Step n="2" title="Analiz" desc="Oyun bitince her hamle Stockfish ile değerlendirilir. Hataların işaretlenir." />
                    <Step n="3" title="Öğren" desc="Gemini Türkçe açıklar: ne yaptın, ne yapmalıydın, ne öğrenmen lazım." />
                </div>
            </section>

            {/* Tech badges */}
            <section className="container mx-auto max-w-6xl px-4 py-8">
                <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
                    <span>Powered by:</span>
                    <Badge variant="outline">Stockfish 16 NNUE</Badge>
                    <Badge variant="outline">Gemini 2.5 Flash</Badge>
                    <Badge variant="outline">React 19</Badge>
                    <Badge variant="outline">Firebase</Badge>
                    <Badge variant="outline">100% Local-First</Badge>
                </div>
            </section>

            {/* CTA */}
            <section className="container mx-auto max-w-3xl px-4 py-16 text-center">
                <Card className="rounded-2xl bg-gradient-to-br from-primary/15 via-accent/5 to-transparent border-primary/30 p-10">
                    <h2 className="text-3xl md:text-4xl font-bold mb-3">Hadi başla.</h2>
                    <p className="text-muted-foreground mb-6">Hesap aç, 13 Gemini key, sınırsız Stockfish — hepsi ücretsiz.</p>
                    <Button asChild size="xl">
                        <Link to="/login"><Sparkles className="w-5 h-5" />Ücretsiz Hesap Aç</Link>
                    </Button>
                </Card>
            </section>

            {/* Footer */}
            <footer className="border-t border-border/40 py-8">
                <div className="container mx-auto max-w-6xl px-4 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4" />
                        <span>ChessAetherius · Hamit Can Fındık</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <a href="https://github.com/hamitcf1/chess-aetherius" target="_blank" rel="noreferrer" className="hover:text-primary inline-flex items-center gap-1">
                            <Github className="w-4 h-4" /> GitHub
                        </a>
                        <a href="https://hamitcf.info" target="_blank" rel="noreferrer" className="hover:text-primary inline-flex items-center gap-1">
                            <Globe className="w-4 h-4" /> Portfolio
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    )
}

function FeatureCard({ icon: Icon, title, desc, color }: { icon: any; title: string; desc: string; color?: string }) {
    return (
        <motion.div whileHover={{ y: -2 }} className="card-modern rounded-xl p-5">
            <div className={`w-10 h-10 rounded-lg bg-current/10 flex items-center justify-center mb-3 ${color}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div className="font-semibold mb-1">{title}</div>
            <div className="text-sm text-muted-foreground leading-relaxed">{desc}</div>
        </motion.div>
    )
}

function Step({ n, title, desc }: { n: string; title: string; desc: string }) {
    return (
        <div className="text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-primary/15 text-primary text-xl font-bold flex items-center justify-center mb-3">
                {n}
            </div>
            <div className="font-semibold mb-1">{title}</div>
            <div className="text-sm text-muted-foreground">{desc}</div>
        </div>
    )
}

// Card wrapper for CTA section
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
    return <div className={className}>{children}</div>
}
