import eslintPluginAstro from 'eslint-plugin-astro';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: ['dist/**', '.astro/**', 'node_modules/**', 'bun.lock'],
  },
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs.recommended,
];
