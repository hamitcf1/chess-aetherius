import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Globe, Menu, X, ArrowLeft, Crown } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSettingsStore } from '@/stores/settingsStore'
import { useAuthStore } from '@/stores/authStore'
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

export function PublicNavbar() {
    const navigate = useNavigate()
    const location = useLocation()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const { language, setLanguage } = useSettingsStore()
    const user = useAuthStore(s => s.user)

    const isAuthPage = location.pathname === '/login'

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/85 backdrop-blur-md border-b border-white/5">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

                {/* Brand */}
                <Link to="/" className="flex items-center gap-2.5 group">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
                        <Crown className="w-4 h-4 text-white" aria-hidden="true" />
                    </div>
                    <span className="font-semibold text-base text-white tracking-tight">ChessAetherius</span>
                </Link>

                {/* Desktop Nav Links */}
                <div className="hidden md:flex items-center gap-1">
                    <a href="#features" className="px-3 py-1.5 text-sm font-medium text-zinc-400 hover:text-white transition-colors">Özellikler</a>
                    <a href="#how" className="px-3 py-1.5 text-sm font-medium text-zinc-400 hover:text-white transition-colors">Nasıl Çalışır</a>
                    <a href="#faq" className="px-3 py-1.5 text-sm font-medium text-zinc-400 hover:text-white transition-colors">SSS</a>
                </div>

                {/* Right side */}
                <div className="hidden md:flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Select language" className="text-zinc-400 hover:text-white hover:bg-white/5 h-9 w-9">
                                <Globe className="w-4 h-4" aria-hidden="true" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-white">
                            <DropdownMenuItem onClick={() => setLanguage('en')} className="hover:bg-white/5 cursor-pointer">
                                English {language === 'en' && <span className="ml-2 text-primary">✓</span>}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setLanguage('tr')} className="hover:bg-white/5 cursor-pointer">
                                Türkçe {language === 'tr' && <span className="ml-2 text-primary">✓</span>}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {!isAuthPage && (
                        <>
                            {user ? (
                                <Button onClick={() => navigate('/app')} size="sm" className="bg-white text-black hover:bg-zinc-200 rounded-full">
                                    Uygulamaya Git
                                </Button>
                            ) : (
                                <>
                                    <Link to="/login" className="px-3 py-1.5 text-sm font-medium text-zinc-300 hover:text-white transition-colors">
                                        Giriş
                                    </Link>
                                    <Button onClick={() => navigate('/login')} size="sm" className="bg-white text-black hover:bg-zinc-200 rounded-full">
                                        Başla
                                    </Button>
                                </>
                            )}
                        </>
                    )}
                    {isAuthPage && (
                        <Button onClick={() => navigate('/')} variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                            <ArrowLeft className="w-4 h-4 mr-1.5" aria-hidden="true" />
                            Ana Sayfaya Dön
                        </Button>
                    )}
                </div>

                {/* Mobile Menu Toggle */}
                <div className="flex md:hidden items-center gap-1">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Select language" className="text-zinc-400 hover:text-white hover:bg-white/5 h-9 w-9">
                                <Globe className="w-4 h-4" aria-hidden="true" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-white">
                            <DropdownMenuItem onClick={() => setLanguage('en')} className="hover:bg-white/5 cursor-pointer">English</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setLanguage('tr')} className="hover:bg-white/5 cursor-pointer">Türkçe</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <button
                        className="h-9 w-9 flex items-center justify-center text-zinc-400 hover:text-white rounded-md"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                        aria-expanded={mobileMenuOpen}
                    >
                        {mobileMenuOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="md:hidden border-b border-white/5 bg-zinc-950 overflow-hidden"
                    >
                        <div className="px-6 py-4 flex flex-col gap-1">
                            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="px-2 py-2.5 text-sm font-medium text-zinc-300 hover:text-white">Özellikler</a>
                            <a href="#how" onClick={() => setMobileMenuOpen(false)} className="px-2 py-2.5 text-sm font-medium text-zinc-300 hover:text-white">Nasıl Çalışır</a>
                            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="px-2 py-2.5 text-sm font-medium text-zinc-300 hover:text-white">SSS</a>
                            <div className="h-px w-full bg-white/10 my-2" />
                            {!isAuthPage && (
                                user ? (
                                    <Button onClick={() => { setMobileMenuOpen(false); navigate('/app') }} className="w-full bg-white text-black hover:bg-zinc-200 rounded-full">
                                        Uygulamaya Git
                                    </Button>
                                ) : (
                                    <>
                                        <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="px-2 py-2.5 text-sm font-medium text-zinc-300 hover:text-white">Giriş</Link>
                                        <Button onClick={() => { setMobileMenuOpen(false); navigate('/login') }} className="w-full mt-2 bg-white text-black hover:bg-zinc-200 rounded-full">
                                            Başla
                                        </Button>
                                    </>
                                )
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    )
}
