// __mocks__/server/vite.ts
// Mock vite module for testing

export function log(message: string, source = "express") {
  // No-op in tests
}

export async function setupVite() {
  // No-op in tests
}

export function serveStatic() {
  // No-op in tests
}
