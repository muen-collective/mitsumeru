import { PublishConsole } from '@/features/publish/PublishConsole'
import { CostStatusBar } from '@/features/publish/CostStatusBar'

/** Block #5 surface — publish console + cost status bar. */
export default function PublishPage() {
  return (
    <main className="flex h-screen min-h-0 flex-col bg-background p-6">
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <PublishConsole />
        <CostStatusBar />
      </div>
    </main>
  )
}
