import nextPlugin from '@next/eslint-plugin-next';
import eslint from 'eslint';

export default [
  eslint.configs.recommended,
  {
    plugins: {
      next: nextPlugin
    },
    rules: {
      // Add any custom rules here
      'next/core-web-vitals': 'error'
    }
  }
]; 