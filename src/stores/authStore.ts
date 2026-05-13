import { create } from 'zustand'
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    updateProfile,
    type User as FirebaseUser,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, googleProvider } from '@/lib/firebase'

export interface ChessUser {
    uid: string
    email: string
    displayName: string
    photoURL?: string
    createdAt?: number
}

interface AuthState {
    user: ChessUser | null
    firebaseUser: FirebaseUser | null
    loading: boolean
    error: string | null
    initialized: boolean
}

interface AuthActions {
    initialize: () => () => void
    signInEmail: (email: string, password: string) => Promise<void>
    signUpEmail: (email: string, password: string, name: string) => Promise<void>
    signInGoogle: () => Promise<void>
    signOut: () => Promise<void>
    clearError: () => void
}

type AuthStore = AuthState & AuthActions

async function ensureUserDoc(fu: FirebaseUser): Promise<ChessUser> {
    const ref = doc(db, 'users', fu.uid)
    const snap = await getDoc(ref)
    if (snap.exists()) {
        const data = snap.data()
        return {
            uid: fu.uid,
            email: fu.email || '',
            displayName: data.displayName || fu.displayName || 'Oyuncu',
            photoURL: data.photoURL || fu.photoURL || undefined,
            createdAt: data.createdAt?.toMillis?.() ?? Date.now(),
        }
    }
    const newUser = {
        email: fu.email || '',
        displayName: fu.displayName || fu.email?.split('@')[0] || 'Oyuncu',
        photoURL: fu.photoURL || null,
        createdAt: serverTimestamp(),
    }
    await setDoc(ref, newUser)
    return {
        uid: fu.uid,
        email: newUser.email,
        displayName: newUser.displayName,
        photoURL: newUser.photoURL || undefined,
        createdAt: Date.now(),
    }
}

function friendlyAuthError(code: string): string {
    const map: Record<string, string> = {
        'auth/invalid-email': 'Geçersiz e-posta',
        'auth/user-not-found': 'Hesap bulunamadı',
        'auth/wrong-password': 'Yanlış şifre',
        'auth/invalid-credential': 'E-posta veya şifre hatalı',
        'auth/email-already-in-use': 'Bu e-posta zaten kullanımda',
        'auth/weak-password': 'Şifre en az 6 karakter olmalı',
        'auth/too-many-requests': 'Çok fazla deneme, biraz sonra tekrar dene',
        'auth/popup-closed-by-user': 'Google girişi iptal edildi',
        'auth/network-request-failed': 'İnternet bağlantısı hatası',
    }
    return map[code] || 'Bir hata oluştu'
}

export const useAuthStore = create<AuthStore>((set) => ({
    user: null,
    firebaseUser: null,
    loading: false,
    error: null,
    initialized: false,

    clearError: () => set({ error: null }),

    initialize: () => {
        const unsub = onAuthStateChanged(auth, async (fu) => {
            if (!fu) {
                set({ user: null, firebaseUser: null, initialized: true })
                return
            }
            try {
                const u = await ensureUserDoc(fu)
                set({ user: u, firebaseUser: fu, initialized: true })
            } catch (e) {
                console.error('User doc fetch failed:', e)
                set({
                    user: { uid: fu.uid, email: fu.email || '', displayName: fu.displayName || 'Oyuncu', photoURL: fu.photoURL || undefined },
                    firebaseUser: fu,
                    initialized: true,
                })
            }
        })
        return unsub
    },

    signInEmail: async (email, password) => {
        set({ loading: true, error: null })
        try {
            await signInWithEmailAndPassword(auth, email, password)
            set({ loading: false })
        } catch (e: any) {
            set({ loading: false, error: friendlyAuthError(e.code || '') })
            throw e
        }
    },

    signUpEmail: async (email, password, name) => {
        set({ loading: true, error: null })
        try {
            const cred = await createUserWithEmailAndPassword(auth, email, password)
            if (name) await updateProfile(cred.user, { displayName: name })
            await ensureUserDoc(cred.user)
            set({ loading: false })
        } catch (e: any) {
            set({ loading: false, error: friendlyAuthError(e.code || '') })
            throw e
        }
    },

    signInGoogle: async () => {
        set({ loading: true, error: null })
        try {
            await signInWithPopup(auth, googleProvider)
            set({ loading: false })
        } catch (e: any) {
            set({ loading: false, error: friendlyAuthError(e.code || '') })
            throw e
        }
    },

    signOut: async () => {
        await firebaseSignOut(auth)
        set({ user: null, firebaseUser: null })
    },
}))
