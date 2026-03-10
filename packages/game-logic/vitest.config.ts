import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        // Use node environment (no DOM)
        environment: 'node',
        // Include test files
        include: ['src/**/__tests__/**/*.test.ts'],
    },
});
