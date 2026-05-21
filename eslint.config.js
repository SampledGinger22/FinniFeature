import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

// Inline plugin: C3 (no import aliasing) compares the imported name to the local name,
// which esquery/no-restricted-syntax cannot express. A tiny custom rule handles it.
const localPlugin = {
  rules: {
    'no-import-alias': {
      meta: {
        type: 'problem',
        docs: { description: 'C3: no import aliasing — rename at the source.' },
        schema: [],
        messages: { aliased: 'C3: no import aliasing. Rename at the source; never `import { X as Y }`.' },
      },
      create(context) {
        return {
          ImportSpecifier(node) {
            if (node.imported.type === 'Identifier' && node.imported.name !== node.local.name) {
              context.report({ node, messageId: 'aliased' });
            }
          },
        };
      },
    },
  },
};

// --- C5/C8 enforced as AST selectors (no-restricted-syntax) ---
const noNewDateRule = {
  selector: "NewExpression[callee.name='Date']",
  message: 'C8: construct dates only in DateTimeUtil (@finni/shared).',
};
const noDefaultExportRule = {
  selector: 'ExportDefaultDeclaration',
  message: 'C5: prefer named exports. Default exports only where a tool requires them.',
};

// --- C2/C8 enforced as import restrictions ---
const restrictedImports = {
  patterns: [
    { group: ['../*', '../**', '..'], message: 'C2: use the @/ alias, not ../ parent traversal.' },
    { group: ['dayjs', 'dayjs/**'], message: 'C8: import dayjs only inside DateTimeUtil.' },
  ],
};
// DateTimeUtil is the one place dayjs and raw Date are allowed (drops the dayjs ban).
const restrictedImportsInDateUtil = {
  patterns: [
    { group: ['../*', '../**', '..'], message: 'C2: use the @/ alias, not ../ parent traversal.' },
  ],
};

// C6/C9: raw numeric/hex/px values are forbidden in style files — reference a token instead.
const styleValueRules = {
  '@typescript-eslint/no-magic-numbers': [
    'error',
    {
      ignore: [0],
      ignoreArrayIndexes: true,
      ignoreEnums: true,
      ignoreReadonlyClassProperties: true,
      ignoreTypeIndexes: true,
    },
  ],
  'no-restricted-syntax': [
    'error',
    noNewDateRule,
    { selector: 'Literal[value=/^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/]', message: 'C6: no hex colors in styles. Reference a design token.' },
    { selector: 'Literal[value=/^-?[0-9.]+px$/]', message: 'C6: no px literals in styles. Reference a design token.' },
  ],
};

export default tseslint.config(
  {
    // Build artifacts, generated files, and tooling scripts are never linted.
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/.turbo/**',
      '**/.vercel/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/playwright-report/**',
      '**/*.d.ts',
      '.claude/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Project-wide conventions C1–C5, C8.
    plugins: { local: localPlugin },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'error',
      'no-redeclare': 'off',
      '@typescript-eslint/no-redeclare': 'error',
      'local/no-import-alias': 'error',
      'no-restricted-imports': ['error', restrictedImports],
      'no-restricted-syntax': ['error', noNewDateRule, noDefaultExportRule],
    },
  },
  {
    // Frontend runs in the browser.
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
  },
  {
    // Backend and shared run in Node.
    files: ['apps/api/**/*.ts', 'packages/shared/**/*.ts'],
    languageOptions: { globals: globals.node },
  },
  {
    // The const-object union enum pattern (§6.4) deliberately pairs a value and a type of
    // the same name; no-redeclare false-flags it. tsc still catches real redeclaration (D36).
    files: ['**/enums/**/*.ts'],
    rules: { '@typescript-eslint/no-redeclare': 'off' },
  },
  {
    // The single sanctioned home for dayjs and raw Date (rule C8).
    files: ['**/DateTimeUtil.ts'],
    rules: {
      'no-restricted-imports': ['error', restrictedImportsInDateUtil],
      'no-restricted-syntax': ['error', noDefaultExportRule],
    },
  },
  {
    // Tool-required default exports (Vercel functions, build/test config).
    files: ['apps/api/api/**/*.ts', '**/*.config.{ts,js}', 'eslint.config.js'],
    rules: {
      'no-restricted-syntax': ['error', noNewDateRule],
    },
  },
  {
    // Tests and the seed script may construct fixture dates directly.
    files: ['**/*.{test,spec}.{ts,tsx}', '**/seed*.ts'],
    rules: {
      'no-restricted-syntax': ['error', noDefaultExportRule],
    },
  },
  {
    // Style files: tokens only, no raw numeric/hex/px values (C6/C9).
    files: ['**/*.styles.{ts,tsx}', '**/theme/**/*.{ts,tsx}'],
    rules: styleValueRules,
  },
);
