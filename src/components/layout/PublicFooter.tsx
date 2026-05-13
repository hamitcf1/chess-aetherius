import { Github, Twitter, Youtube, Crown } from 'lucide-react'
import { Link } from 'react-router-dom'

export function PublicFooter() {
    return (
        <footer className="py-12 border-t border-white/5 bg-zinc-950 shrink-0">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">

                    {/* Brand & Socials */}
                    <div className="col-span-2 md:col-span-1">
                        <Link to="/" className="flex items-center gap-2.5 mb-4 w-fit">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                                <Crown className="w-3.5 h-3.5 text-white" aria-hidden="true" />
                            </div>
                            <span className="font-semibold text-white text-sm">ChessAetherius</span>
                        </Link>
                        <p className="text-sm text-zinc-500 leading-relaxed mb-6 pr-4">
                            AI destekli modern satranç öğrenme platformu. Stockfish 16 + Gemini ile, sıfırdan ustalığa.
                        </p>
                        <div className="flex gap-4">
                            <a href="https://github.com/hamitcf1/chess-aetherius" target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-white transition-colors" aria-label="GitHub">
                                <Github className="w-5 h-5" />
                            </a>
                            <a href="https://twitter.com/hamitcf" target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-white transition-colors" aria-label="Twitter">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="https://youtube.com/@hamitcf" target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-white transition-colors" aria-label="YouTube">
                                <Youtube className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Product */}
                    <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-4">Ürün</h4>
                        <ul className="flex flex-col gap-2.5">
                            <li><a href="#features" className="text-sm text-zinc-400 hover:text-primary transition-colors">Özellikler</a></li>
                            <li><a href="#how" className="text-sm text-zinc-400 hover:text-primary transition-colors">Nasıl Çalışır</a></li>
                            <li><Link to="/app" className="text-sm text-zinc-400 hover:text-primary transition-colors">Uygulamaya Git</Link></li>
                            <li><Link to="/login" className="text-sm text-zinc-400 hover:text-primary transition-colors">Giriş Yap</Link></li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-4">Kaynaklar</h4>
                        <ul className="flex flex-col gap-2.5">
                            <li><a href="https://github.com/hamitcf1/chess-aetherius" target="_blank" rel="noreferrer" className="text-sm text-zinc-400 hover:text-primary transition-colors">GitHub</a></li>
                            <li><a href="#faq" className="text-sm text-zinc-400 hover:text-primary transition-colors">SSS</a></li>
                            <li><a href="https://hamitcf.info" target="_blank" rel="noreferrer" className="text-sm text-zinc-400 hover:text-primary transition-colors">Portfolio</a></li>
                        </ul>
                    </div>

                    {/* Other Projects */}
                    <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-4">Diğer Projeler</h4>
                        <ul className="flex flex-col gap-2.5">
                            <li><a href="https://relay.hamitcf.info" target="_blank" rel="noreferrer" className="text-sm text-zinc-400 hover:text-primary transition-colors">Aetherius Relay</a></li>
                            <li><a href="https://vitality.hamitcf.info" target="_blank" rel="noreferrer" className="text-sm text-zinc-400 hover:text-primary transition-colors">Vitality</a></li>
                            <li><a href="https://lexify.hamitcf.info" target="_blank" rel="noreferrer" className="text-sm text-zinc-400 hover:text-primary transition-colors">Lexify</a></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-3">
                    <p className="text-xs text-zinc-500">
                        © {new Date().getFullYear()} ChessAetherius · Hamit Can Fındık. Tüm hakları saklıdır.
                    </p>
                </div>
            </div>
        </footer>
    )
}
