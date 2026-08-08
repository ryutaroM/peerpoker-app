import prettier from 'eslint-config-prettier';
import { fileURLToPath } from 'node:url';
import { includeIgnoreFile } from '@eslint/compat';
import svelte from 'eslint-plugin-svelte';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

export default defineConfig(includeIgnoreFile(gitignorePath), {
	// .ts/.js の一般的な lint は Biome に委譲。
	// ESLint は Svelte コンポーネント(および *.svelte.ts / *.svelte.js)専用スコープに限定する。
	files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
	extends: [
		...ts.configs.recommended,
		...svelte.configs.recommended,
		prettier,
		...svelte.configs.prettier
	],
	languageOptions: {
		globals: { ...globals.browser, ...globals.node },
		parserOptions: {
			// <script lang="ts"> をパースするために typescript-eslint の parser は引き続き必要
			projectService: true,
			extraFileExtensions: ['.svelte'],
			parser: ts.parser,
			svelteConfig
		}
	},
	rules: {
		// typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
		// see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
		'no-undef': 'off'
	}
});
