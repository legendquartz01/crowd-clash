import fs from 'node:fs'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

function resolveEnvDir(): string | false {
  const envFile = path.resolve(process.cwd(), '.env')
  if (!fs.existsSync(envFile)) {
    return process.cwd()
  }
  try {
    fs.accessSync(envFile, fs.constants.R_OK)
    return process.cwd()
  } catch {
    // Gracefully skip reading .env when the runtime sandbox restricts access to ~/.env
    return false
  }
}

// https://vite.dev/config/
export default defineConfig({
  envDir: resolveEnvDir(),
  plugins: [react(), tailwindcss()],
})
