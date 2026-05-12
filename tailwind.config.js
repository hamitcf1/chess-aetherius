import defaultTheme from 'tailwindcss/defaultTheme'

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        './index.html',
        './src/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', ...defaultTheme.fontFamily.sans],
                display: ['Cal Sans', 'Inter', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))',
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))',
                },
                success: {
                    DEFAULT: 'hsl(var(--success))',
                    foreground: 'hsl(var(--success-foreground))',
                },
                warning: {
                    DEFAULT: 'hsl(var(--warning))',
                    foreground: 'hsl(var(--warning-foreground))',
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))',
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))',
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))',
                },
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))',
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))',
                },
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',

                // Chess-specific palette
                'board-light': 'var(--board-light)',
                'board-dark': 'var(--board-dark)',
                'board-highlight': 'var(--board-highlight)',
                'board-lastmove': 'var(--board-lastmove)',
                'eval-good': 'hsl(var(--eval-good))',
                'eval-bad': 'hsl(var(--eval-bad))',
                'piece-blunder': 'hsl(var(--piece-blunder))',
                'piece-mistake': 'hsl(var(--piece-mistake))',
                'piece-inaccuracy': 'hsl(var(--piece-inaccuracy))',
                'piece-good': 'hsl(var(--piece-good))',
                'piece-best': 'hsl(var(--piece-best))',
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
            },
            keyframes: {
                'fade-in': {
                    from: { opacity: '0' },
                    to: { opacity: '1' },
                },
                'slide-in-from-top': {
                    from: { transform: 'translateY(-10px)', opacity: '0' },
                    to: { transform: 'translateY(0)', opacity: '1' },
                },
                'slide-in-from-bottom': {
                    from: { transform: 'translateY(10px)', opacity: '0' },
                    to: { transform: 'translateY(0)', opacity: '1' },
                },
                'slide-in-from-right': {
                    from: { transform: 'translateX(10px)', opacity: '0' },
                    to: { transform: 'translateX(0)', opacity: '1' },
                },
                'scale-in': {
                    from: { transform: 'scale(0.95)', opacity: '0' },
                    to: { transform: 'scale(1)', opacity: '1' },
                },
                'glow-pulse': {
                    '0%, 100%': { opacity: '1', filter: 'brightness(1)' },
                    '50%': { opacity: '0.85', filter: 'brightness(1.2)' },
                },
                'shimmer': {
                    '0%': { backgroundPosition: '-1000px 0' },
                    '100%': { backgroundPosition: '1000px 0' },
                },
                'confetti-fall': {
                    '0%': { transform: 'translateY(-100vh) rotate(0deg)', opacity: '1' },
                    '100%': { transform: 'translateY(100vh) rotate(720deg)', opacity: '0' },
                },
                'achievement-pop': {
                    '0%': { transform: 'scale(0) rotate(-180deg)', opacity: '0' },
                    '50%': { transform: 'scale(1.1) rotate(-10deg)', opacity: '1' },
                    '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
                },
                'check-pulse': {
                    '0%, 100%': { boxShadow: '0 0 0 0 hsl(var(--destructive) / 0.7)' },
                    '50%': { boxShadow: '0 0 0 12px hsl(var(--destructive) / 0)' },
                },
            },
            animation: {
                'fade-in': 'fade-in 0.2s ease-out',
                'slide-in-from-top': 'slide-in-from-top 0.3s ease-out',
                'slide-in-from-bottom': 'slide-in-from-bottom 0.3s ease-out',
                'slide-in-from-right': 'slide-in-from-right 0.3s ease-out',
                'scale-in': 'scale-in 0.2s ease-out',
                'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
                'shimmer': 'shimmer 2s linear infinite',
                'confetti-fall': 'confetti-fall 3s linear forwards',
                'achievement-pop': 'achievement-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                'check-pulse': 'check-pulse 1.5s ease-out infinite',
            },
        },
    },
    plugins: [require('tailwindcss-animate')],
}
