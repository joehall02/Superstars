import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// https://vite.dev/config/
export default defineConfig({
	plugins: [react()],
	build: {
		rolldownOptions: {
			output: {
				// Split third-party deps into stable, separately-cacheable chunks: MUI +
				// emotion (the bulk) apart from the react core, so a MUI upgrade doesn't
				// bust the react cache and neither re-downloads when app code changes.
				// `mui` is listed first so its modules match before the catch-all `vendor`.
				codeSplitting: {
					groups: [
						{ name: 'mui', test: /node_modules[\\/](@mui|@emotion|tss-react)[\\/]/ },
						{ name: 'vendor', test: /node_modules/ },
					],
				},
			},
		},
	},
	test: {
		// Jest-style global describe/test/expect, so no imports needed in specs.
		globals: true,
		// Business-logic tests run in node; component tests that need the DOM
		// can opt in per-file with a `// @vitest-environment jsdom` comment.
		environment: 'node',
		include: ['{api,lib,src}/**/*.{test,spec}.{ts,tsx}'],
	},
});
