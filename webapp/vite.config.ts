import { defineConfig } from 'vitest/config'
import { defaultClientConditions, defaultServerConditions } from 'vite'

// Use the mail-link library's TypeScript sources directly (no prior build of the library needed).
const conditions = ['mail-link-source'];

export default defineConfig({
    base: './', // Relative paths
    resolve: {conditions: [...conditions, ...defaultClientConditions]},
    ssr: {resolve: {conditions: [...conditions, ...defaultServerConditions]}},
    build: {
        rollupOptions: {
            input: {
                main: 'index.html',
                generate: 'generate.html',
                bookmarklet: 'bookmarklet.html',
            },
        },
    },
    server: {
        open: "/#a5ce5048-46cb-454b-afcd-8012add2c8c1%40x.unruh.de&subject=An%20interesting%20email...&date=2026-02-06T17%3A45%3A30.000Z&from=Sender%20Name%20%3Cgit.maillink.32gdvl%40x.unruh.de%3E&to=Recipient%20Name%20%3Crecipient%40example.com%3E&whohasit=Dominique%20Unruh",
        // Allow importing the bookmarklet template/inject from the sibling subproject.
        fs: {allow: ['..']},
    },
    test: {
        environment: 'node',
        include: ['test/**/*.test.ts'],
    },
})