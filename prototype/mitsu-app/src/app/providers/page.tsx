import { ProviderPanel } from '@/features/providers/ProviderPanel'

/** Block #1 surface — provider settings. The settings shell (Block #2) will host this. */
export default function ProvidersPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <ProviderPanel />
    </main>
  )
}
