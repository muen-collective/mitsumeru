'use client'

import { useState } from 'react'
import {
  ArrowLeft,
  BookOpen,
  Globe,
  Import,
  LogOut,
  PencilSparkles,
  Plug,
  Server,
  User,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useSessionStore } from '@/core/stores/session'
import { ProviderPanel } from '@/features/providers/ProviderPanel'
import {
  MemorySection,
  McpSection,
  MigrateSection,
  ProfileSection,
  SitesSection,
  SkillsSection,
} from './SettingsSections'

export type SectionId = 'profile' | 'providers' | 'sites' | 'mcp' | 'skills' | 'memory' | 'migrate'

const SECTIONS: { id: SectionId; label: string; icon: typeof User }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'providers', label: 'Providers', icon: Server },
  { id: 'sites', label: 'Sites', icon: Globe },
  { id: 'mcp', label: 'MCP servers', icon: Plug },
  { id: 'skills', label: 'Skills', icon: BookOpen },
  { id: 'memory', label: 'Memory', icon: PencilSparkles },
  { id: 'migrate', label: 'Migrate', icon: Import },
]

const SECTION_META: Record<SectionId, { title: string; sub: string }> = {
  profile: { title: 'Profile', sub: 'Manage your account, appearance and updates.' },
  providers: {
    title: 'Providers',
    sub: 'Add your own API keys and choose which models to use. Everything stays on this device.',
  },
  sites: { title: 'Sites', sub: 'Websites you publish from Mitsu. Content-only — code never changes.' },
  mcp: { title: 'MCP servers', sub: 'Connect local tools that give Mitsu extra abilities.' },
  skills: { title: 'Skills', sub: 'Turn the built-in skills on or off.' },
  memory: {
    title: 'Memory',
    sub: 'Mitsu remembers your preferences. Review what it stores and clear it anytime.',
  },
  migrate: { title: 'Migrate', sub: 'Import a project from Claude, ChatGPT or Gemini and keep working here.' },
}

/** Settings shell — Block #2 (story: Patterns/Settings → Mitsu MVP settings).
 * Fullscreen page: header bar, 216px nav sidebar with accent-tinted active
 * rows, content with equal 2.5rem gutters and no fixed cap. */
export function SettingsShell({ initialSection = 'providers' }: { initialSection?: SectionId }) {
  const [section, setSection] = useState<SectionId>(initialSection)
  const signOut = useSessionStore((s) => s.signOut)

  const navItem = (id: SectionId, label: string, Icon: typeof User) => {
    const active = section === id
    return (
      <button
        key={id}
        type="button"
        onClick={() => setSection(id)}
        className={cn(
          'flex w-full cursor-pointer items-center gap-2.5 rounded-lg border-none px-3 py-[9px] text-left text-[0.82rem] transition-colors',
          active
            ? 'bg-accent/10 text-foreground'
            : 'font-medium text-muted-foreground hover:bg-muted hover:text-foreground',
        )}
      >
        <Icon className="size-4 shrink-0" />
        <span className="flex-1">{label}</span>
      </button>
    )
  }

  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-background font-sans text-foreground antialiased">
      {/* Header bar — back, title, close. */}
      <header className="flex shrink-0 items-center gap-2 px-4 py-2.5">
        <Button variant="ghost" size="icon-sm" title="Back to workspace" aria-label="Back to workspace">
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-sm font-semibold text-foreground">
          Settings
          <span className="ml-2 text-xs font-normal text-muted-foreground">Mitsu MVP</span>
        </h1>
        <div className="flex-1" />
        <Button variant="ghost" size="icon-sm" title="Close settings" aria-label="Close settings">
          <X className="size-4" />
        </Button>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Sidebar — 216px. */}
        <aside className="flex w-[216px] shrink-0 flex-col overflow-y-auto bg-background px-3 py-5">
          <nav className="flex flex-col gap-0.5">
            {SECTIONS.map((s) => navItem(s.id, s.label, s.icon))}
            <button
              type="button"
              onClick={() => void signOut()}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg border-none px-3 py-[9px] text-left text-[0.82rem] font-medium text-destructive transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="size-4 shrink-0" />
              <span>Sign Out</span>
            </button>
          </nav>
        </aside>

        {/* Content — equal 2.5rem gutters, no fixed cap. */}
        <main className="min-w-0 flex-1 overflow-y-auto" style={{ padding: '2.5rem 0 4rem' }}>
          <div style={{ width: 'calc(100% - 5rem)', margin: '0 auto' }}>
            <div className="mb-6">
              <h2 className="text-[1.1rem] font-semibold leading-tight">{SECTION_META[section].title}</h2>
              <p className="mt-0.5 text-[0.8rem] text-muted-foreground">{SECTION_META[section].sub}</p>
            </div>
            {section === 'profile' && <ProfileSection />}
            {section === 'providers' && <ProviderPanel embedded />}
            {section === 'sites' && <SitesSection />}
            {section === 'mcp' && <McpSection />}
            {section === 'skills' && <SkillsSection />}
            {section === 'memory' && <MemorySection />}
            {section === 'migrate' && <MigrateSection />}
          </div>
        </main>
      </div>
    </div>
  )
}
