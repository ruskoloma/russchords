/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		react(),
		VitePWA({
			// A new version waits until the user accepts the "Update available"
			// prompt (see src/app/UpdatePrompt.tsx), so open tabs never lose the
			// chunks their lazy routes still need.
			registerType: 'prompt',
			injectRegister: false,
			includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'favicon-32x32.png', 'favicon-16x16.png'],
			manifest: {
				name: 'russchords',
				short_name: 'russchords',
				description: 'Your chords and lyrics manager',
				theme_color: '#f6f4f0',
				background_color: '#f6f4f0',
				display: 'standalone',
				start_url: '/',
				icons: [
					{
						src: 'android-chrome-192x192.png',
						sizes: '192x192',
						type: 'image/png',
					},
					{
						src: 'android-chrome-512x512.png',
						sizes: '512x512',
						type: 'image/png',
					},
				],
			},
			workbox: {
				skipWaiting: false,
				clientsClaim: false,
				cleanupOutdatedCaches: true,
				navigateFallbackDenylist: [/^\/assets(?:\/|$)/],
				// API responses are deliberately NOT cached by the service worker:
				// a stale-while-revalidate cache here used to show outdated songs and
				// playlists right after editing them, and ignored which user was
				// signed in. Offline data lives in the TanStack Query cache instead
				// (IndexedDB, per user, invalidated after every change).
				runtimeCaching: [
					{
						// Font files (only the subsets a page actually uses are fetched).
						urlPattern: /\.(woff2?|ttf|otf)$/,
						handler: 'CacheFirst',
						options: {
							cacheName: 'russchords-fonts',
							expiration: {
								maxEntries: 40,
								maxAgeSeconds: 60 * 60 * 24 * 365,
							},
						},
					},
				],
			},
		}),
		// Only emit the bundle visualizer when a build is run with ANALYZE=1. Keeps
		// normal production builds clean; `npm run build:analyze` produces
		// `dist/stats.html` for inspection. Cast `process` here because
		// tsconfig.node.json doesn't pull in @types/node and we don't want to
		// force it just for this one-liner.
		(globalThis as unknown as { process?: { env: Record<string, string | undefined> } }).process?.env?.ANALYZE
			? visualizer({
					filename: 'dist/stats.html',
					gzipSize: true,
					brotliSize: true,
					open: false,
				})
			: null,
	],
	test: {
		environment: 'jsdom',
		setupFiles: ['./vitest.setup.ts'],
		css: false,
		include: ['src/**/*.{test,spec}.{ts,tsx}'],
		exclude: ['node_modules', 'dist', 'tests-e2e/**'],
	},
});
