import { type ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { TopBar } from './TopBar'

interface AppLayoutProps {
    children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
    return (
        <div className="flex h-screen bg-background">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <TopBar />
                <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
                    {children}
                </main>
                <MobileNav />
            </div>
        </div>
    )
}
