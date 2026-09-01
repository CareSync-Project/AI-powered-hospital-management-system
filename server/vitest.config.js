import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // PostgreSQL integration suites create isolated records, but serializable
    // transactions should not be made to conflict across test files.
    fileParallelism: false,
  },
});
