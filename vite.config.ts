import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// https://vite.dev/config/
export default defineConfig({
	plugins: [react()],
	test: {
		// Jest-style global describe/test/expect, so no imports needed in specs.
		globals: true,
		// Business-logic tests run in node; component tests that need the DOM
		// can opt in per-file with a `// @vitest-environment jsdom` comment.
		environment: 'node',
		include: ['{lib,src}/**/*.{test,spec}.{ts,tsx}'],
	},
});
