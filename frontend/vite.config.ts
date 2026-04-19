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
			registerType: 'autoUpdate',
			includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'favicon-32x32.png', 'favicon-16x16.png'],
			manifest: {
				name: 'russchords',
				short_name: 'russchords',
				description: 'Your chords and lyrics manager',
				theme_color: '#ffffff',
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
				// Runtime caching rules for the backend API. Play-mode loads are the
				// most expensive first paint — cache song + playlist GETs so repeat
				// visits (or offline reload) return instantly from the SW cache.
				runtimeCaching: [
					{
						urlPattern: /\/(song|playlist|starred)(\/|$)/,
						handler: 'StaleWhileRevalidate',
						options: {
							cacheName: 'russchords-api-cache',
							expiration: {
								maxEntries: 200,
								maxAgeSeconds: 60 * 60 * 24, // 1 day
							},
							cacheableResponse: { statuses: [0, 200] },
						},
					},
					{
						// JetBrains Mono + Inter font files served by our own bundle.
						urlPattern: /\.(woff2?|ttf|otf)$/,
						handler: 'CacheFirst',
						options: {
							cacheName: 'russchords-fonts',
							expiration: {
								maxEntries: 20,
								maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
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
