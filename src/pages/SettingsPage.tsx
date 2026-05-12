import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { Settings, Palette, Volume2, Globe, Brain, Database, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useSettingsStore } from '@/stores/settingsStore'
import { useProfileStore } from '@/stores/profileStore'
import { db } from '@/lib/db'
import { toast } from 'sonner'

export function SettingsPage() {
    const { t } = useTranslation()
    const settings = useSettingsStore()
    const profile = useProfileStore()
    const [resetOpen, setResetOpen] = useState(false)

    const handleReset = async () => {
        await db.delete()
        profile.reset()
        localStorage.removeItem('satranc-puzzles-seed-version')
        toast.success('Profil sıfırlandı')
        setResetOpen(false)
        setTimeout(() => window.location.reload(), 1000)
    }

    return (
        <div className="container mx-auto max-w-3xl p-4 md:p-6 space-y-6">
            <header>
                <h1 className="text-2xl font-bold flex items-center gap-2"><Settings className="w-6 h-6" />{t('settings.title')}</h1>
                <p className="text-sm text-muted-foreground">{t('settings.subtitle')}</p>
            </header>

            {/* Language */}
            <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Globe className="w-4 h-4" />{t('settings.language')}</CardTitle></CardHeader>
                <CardContent>
                    <Select value={settings.language} onValueChange={(v) => settings.setLanguage(v as any)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="tr">{t('settings.languageTurkish')}</SelectItem>
                            <SelectItem value="en">{t('settings.languageEnglish')}</SelectItem>
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {/* Appearance */}
            <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Palette className="w-4 h-4" />{t('settings.theme')}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label className="mb-2 block">{t('settings.theme')}</Label>
                        <Select value={settings.theme} onValueChange={(v) => settings.setTheme(v as any)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="dark">{t('settings.themeDark')}</SelectItem>
                                <SelectItem value="midnight">{t('settings.themeMidnight')}</SelectItem>
                                <SelectItem value="light">{t('settings.themeLight')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className="mb-2 block">{t('settings.boardTheme')}</Label>
                        <Select value={settings.boardTheme} onValueChange={(v) => settings.setBoardTheme(v as any)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="green">Lichess Yeşil</SelectItem>
                                <SelectItem value="brown">Klasik Kahve</SelectItem>
                                <SelectItem value="blue">Mavi</SelectItem>
                                <SelectItem value="purple">Mor</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <SwitchRow label={t('settings.showCoordinates')} checked={settings.showCoordinates} onCheckedChange={settings.setShowCoordinates} />
                    <SwitchRow label={t('settings.showLegalMoves')} checked={settings.showLegalMoves} onCheckedChange={settings.setShowLegalMoves} />
                    <SwitchRow label={t('settings.highlightLastMove')} checked={settings.highlightLastMove} onCheckedChange={settings.setHighlightLastMove} />
                    <SwitchRow label={t('settings.autoQueenPromotion')} checked={settings.autoQueenPromotion} onCheckedChange={settings.setAutoQueenPromotion} />
                </CardContent>
            </Card>

            {/* Sound */}
            <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Volume2 className="w-4 h-4" />{t('settings.sound')}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    <SwitchRow label={t('settings.sound')} checked={settings.soundEnabled} onCheckedChange={settings.setSoundEnabled} />
                    <SwitchRow label={t('settings.moveSounds')} checked={settings.moveSoundEnabled} onCheckedChange={(v) => settings.toggle('moveSoundEnabled')} disabled={!settings.soundEnabled} />
                    <SwitchRow label={t('settings.captureSounds')} checked={settings.captureSoundEnabled} onCheckedChange={(v) => settings.toggle('captureSoundEnabled')} disabled={!settings.soundEnabled} />
                    <SwitchRow label={t('settings.victorySound')} checked={settings.victorySoundEnabled} onCheckedChange={(v) => settings.toggle('victorySoundEnabled')} disabled={!settings.soundEnabled} />
                </CardContent>
            </Card>

            {/* AI */}
            <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Brain className="w-4 h-4" />{t('settings.ai')}</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label className="mb-2 block">{t('settings.geminiModel')}</Label>
                        <Select value={settings.geminiModel} onValueChange={(v) => settings.setGeminiModel(v as any)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash (Hızlı)</SelectItem>
                                <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro (Güçlü)</SelectItem>
                                <SelectItem value="gemini-3-flash-preview">Gemini 3 Flash (Preview)</SelectItem>
                                <SelectItem value="gemini-3-pro-preview">Gemini 3 Pro (Preview)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <SwitchRow label={t('settings.aiCoaching')} checked={settings.aiCoachingEnabled} onCheckedChange={settings.setAiCoachingEnabled} />
                        <p className="text-xs text-muted-foreground">{t('settings.aiCoachingDesc')}</p>
                    </div>
                </CardContent>
            </Card>

            {/* Data */}
            <Card>
                <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Database className="w-4 h-4" />{t('settings.data')}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                    <Button variant="destructive" onClick={() => setResetOpen(true)}>
                        <AlertTriangle className="w-4 h-4" />
                        {t('settings.resetProfile')}
                    </Button>
                </CardContent>
            </Card>

            <Separator />

            <Card>
                <CardContent className="p-4 flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('settings.version')}</span>
                    <span className="font-mono">0.1.0</span>
                </CardContent>
            </Card>

            <Dialog open={resetOpen} onOpenChange={setResetOpen}>
                <DialogContent>
                    <DialogTitle className="text-destructive">{t('settings.resetProfile')}</DialogTitle>
                    <DialogDescription>{t('settings.resetConfirm')}</DialogDescription>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setResetOpen(false)}>{t('common.cancel')}</Button>
                        <Button variant="destructive" onClick={handleReset}>{t('common.confirm')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function SwitchRow({ label, checked, onCheckedChange, disabled }: { label: string; checked: boolean; onCheckedChange: (v: boolean) => void; disabled?: boolean }) {
    return (
        <div className="flex items-center justify-between">
            <Label className={disabled ? 'opacity-50' : ''}>{label}</Label>
            <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
        </div>
    )
}
