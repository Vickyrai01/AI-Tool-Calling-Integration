import type { Config } from 'jest';

const config: Config = {
  rootDir: '.',
  testEnvironment: 'node',

  setupFiles: ['<rootDir>/test/e2e/setup-env.ts'],

  testMatch: [
    '<rootDir>/test/**/*.e2e.spec.ts',
    '<rootDir>/test/**/*.e2e-spec.ts',
  ],

  moduleFileExtensions: ['ts', 'js', 'json'],

  transform: {
    '^.+\\.(t|j)s$': [
      '@swc/jest',
      {
        jsc: {
          parser: {
            syntax: 'typescript',
            decorators: true,
            dynamicImport: true,
          },
          transform: {
            legacyDecorator: true,
            decoratorMetadata: true,
          },
          target: 'es2022',
        },
        module: {
          type: 'commonjs',
        },
        sourceMaps: 'inline',
      },
    ],
  },
};

export default config;
