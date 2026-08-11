import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import react from "eslint-plugin-react"
import jsxA11y from "eslint-plugin-jsx-a11y"
import jest from "eslint-plugin-jest"
import stylistic from '@stylistic/eslint-plugin'
import simpleImportSort from "eslint-plugin-simple-import-sort"
import unusedImports from "eslint-plugin-unused-imports"
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
	globalIgnores(['dist', 'build', 'lib']),
	{
		files: ['**/*.{ts,tsx}'],
		extends: [
			js.configs.recommended,
			react.configs.flat.recommended,
			react.configs.flat['jsx-runtime'],
			tseslint.configs.recommended,
			jsxA11y.flatConfigs.recommended,
			reactHooks.configs.flat.recommended,
			reactRefresh.configs.vite,
		],
		plugins: {
			'@stylistic': stylistic,
			'simple-import-sort': simpleImportSort,
			'unused-imports': unusedImports
		},
		rules: {
			"@stylistic/indent": ["warn", "tab"],
			"@stylistic/semi": ["error", "always"],
			"@stylistic/comma-dangle": ["error", "always-multiline"],
			"@stylistic/quotes": ["error", "single", { "avoidEscape": true }],
			"@stylistic/max-len": ["warn", {
				"code": 150,
				"ignoreComments": true,
				"ignorePattern": "^(?:import|export)\\s",
			}],
			"@stylistic/object-curly-spacing": ["error", "always"],
			"react/jsx-indent": ["error", "tab"],
			"react/jsx-indent-props": ["error", "tab"],
			"react/jsx-tag-spacing": ["error", { "beforeSelfClosing": "always" }],
			"jsx-quotes": ["error", "prefer-single"],
			"no-console": ["warn", { "allow": ["warn", "error"] }],

			// Unused variables rules configuration
			"no-unused-vars": "off",
			"unused-imports/no-unused-imports": "error",
			"unused-imports/no-unused-vars": ["warn", { "varsIgnorePattern": "^_", "argsIgnorePattern": "^_" }],
			"@typescript-eslint/no-unused-vars": ["warn", { "varsIgnorePattern": "^_", "argsIgnorePattern": "^_" }],

			"simple-import-sort/imports": "error",
			"simple-import-sort/exports": "error",
			"no-multiple-empty-lines": ["error", { "max": 1, "maxBOF": 0, "maxEOF": 0 }],

			"jsx-a11y/media-has-caption": 'off'
		},
		languageOptions: {
			ecmaVersion: 2020,
			globals: globals.browser,
		},
	},
	{
		files: ["**/*.test.{ts,tsx}"],
		extends: [jest.configs["flat/recommended"]],
	},
	{
		settings: {
			react: {
				version: "detect"
			}
		}
	}
])