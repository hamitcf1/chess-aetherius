import { type ReactNode } from 'react'
import { PublicNavbar } from './PublicNavbar'
import { PublicFooter } from './PublicFooter'

export function PublicLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex flex-col min-h-screen bg-black">
            <PublicNavbar />
            <main className="flex-1 pt-16">{children}</main>
            <PublicFooter />
        </div>
    )
}
