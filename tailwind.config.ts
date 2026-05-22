import type { Config } from "tailwindcss";
import typography from '@tailwindcss/typography';
import animate from 'tailwindcss-animate';

export default {
	darkMode: ["class"],
	content: [
		"./index.html",
		"./src/**/*.{ts,tsx,js,jsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				inter: ['Inter', 'sans-serif'],
				mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
			},
			colors: {
				redex: {
					red: 'hsl(var(--redex-red))',
					'red-hover': 'hsl(var(--redex-red-hover))',
					'red-active': 'hsl(var(--redex-red-active))',
					black: 'hsl(var(--redex-black))',
					offwhite: 'hsl(var(--redex-offwhite))',
				},
				brand: {
					DEFAULT: 'hsl(var(--brand))',
					darker: 'hsl(var(--brand-darker))',
					foreground: 'hsl(var(--brand-foreground))',
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					bg: 'hsl(var(--success-bg))',
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					bg: 'hsl(var(--warning-bg))',
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'var(--radius-sm)'
			},
		}
	},
	plugins: [animate, typography],
} satisfies Config;
