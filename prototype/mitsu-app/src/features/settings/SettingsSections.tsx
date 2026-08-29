'use client'

import { useState } from 'react'
import {
  AlertTriangle,
  Check,
  ExternalLink,
  Trash2,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

/* ───────────────────────── shared bits ───────────────────────── */

const spinner = <span className="size-3 animate-spin rounded-full border-2 border-input border-t-primary" />

const Glyph = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
    <path d="M12 2.5 21.5 12 12 21.5 2.5 12 12 2.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M12 7 17 12l-5 5-5-5 5-5z" stroke="currentColor" strokeWidth="1.1" opacity=".55" strokeLinejoin="round" />
  </svg>
)

const rowSwitch = (on: boolean, onToggle: () => void, label: string) => (
  <Switch checked={on} onCheckedChange={onToggle} size="sm" aria-label={label} />
)

/* ───────────────────────── Profile (S1) ───────────────────────── */

export function ProfileSection() {
  const [manageOpen, setManageOpen] = useState(false)
  const [themePref, setThemePref] = useState<'auto' | 'light' | 'dark'>('dark')
  const [checking, setChecking] = useState(false)
  const [updateStatus, setUpdateStatus] = useState<string | null>(null)

  const checkUpdates = () => {
    setChecking(true)
    setUpdateStatus(null)
    window.setTimeout(() => {
      setChecking(false)
      setUpdateStatus('New version 1.1.0 available.')
    }, 900)
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
          <User className="size-[22px]" />
        </div>
        <div>
          <div className="text-[1.05rem] font-semibold">Thuy Pham</div>
          <div className="text-[0.8rem] text-muted-foreground">thuy@muen.studio</div>
        </div>
      </div>
      <div className="mt-2">
        <Button
          variant="outline"
          size="sm"
          className="border-secondary text-secondary hover:bg-secondary/10 hover:text-secondary"
          onClick={() => setManageOpen(true)}
        >
          Manage account
        </Button>
      </div>

      <Dialog open={manageOpen} onOpenChange={(o) => !o && setManageOpen(false)}>
        <DialogContent className="w-[min(340px,86%)]">
          <DialogTitle>Manage your account</DialogTitle>
          <DialogDescription>
            Opens Clerk’s account panel where you change your password, email and security settings.
          </DialogDescription>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setManageOpen(false)}>
              Cancel
            </Button>
            <Button variant="default" size="sm" onClick={() => setManageOpen(false)}>
              Open account panel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Appearance — theme tabs only (no panel, no swatches) */}
      <div className="mt-6">
        <div className="text-[12.5px] font-medium">Appearance</div>
        <Tabs value={themePref} onValueChange={(v) => setThemePref(v as 'auto' | 'light' | 'dark')} className="mt-2 w-fit">
          <TabsList>
            {(['auto', 'light', 'dark'] as const).map((t) => (
              <TabsTrigger key={t} value={t} className="text-xs capitalize">
                {t}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Versions & Updates + About */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-muted p-3">
          <div className="text-[12.5px] font-medium">Versions &amp; Updates</div>
          <div className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
            1.0.0 <span className="font-normal text-muted-foreground">(build 8)</span>
            {updateStatus?.startsWith('New version') ? (
              <AlertTriangle className="size-3 text-warning" aria-label="New version available" />
            ) : (
              <Check className="size-3 text-success" aria-label="Latest version" />
            )}
          </div>
          <div className="mt-1 text-[11.5px] text-muted-foreground">
            {updateStatus ?? "You're on the latest version."}
          </div>
          <div className="mt-2">
            {checking ? (
              <Button variant="outline" size="sm" disabled className="flex items-center gap-2">
                {spinner}Checking…
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={checkUpdates}>
                Check for updates
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted p-3">
          <div className="flex items-center gap-2">
            <Glyph className="size-5 text-primary" />
            <span className="text-sm font-semibold">Mitsu</span>
            <span className="text-[11px] text-muted-foreground">Mitsumeru · 1.0.0</span>
          </div>
          <div className="mt-2 flex flex-col gap-1">
            {[
              ['Documentation', 'API reference'],
              ['Source code', 'GitHub README'],
              ['Website', 'mitsu.app'],
            ].map(([label, sub]) => (
              <a
                key={label}
                href="#"
                onClick={(e) => e.preventDefault()}
                className="flex items-center justify-between rounded-md px-1.5 py-1.5 text-[11.5px] hover:bg-muted-foreground/10"
              >
                <span className="font-medium text-foreground">{label}</span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  {sub}
                  <ExternalLink className="size-[11px]" aria-hidden="true" />
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

/* ───────────────────────── MCP servers (S6) ───────────────────────── */

interface McpServer {
  id: string
  name: string
  command: string
  enabled: boolean
}

const INITIAL_MCP: McpServer[] = [
  { id: 'filesystem', name: 'Filesystem', command: 'npx -y @modelcontextprotocol/server-filesystem', enabled: true },
  { id: 'sequential', name: 'Sequential Thinking', command: 'npx -y @modelcontextprotocol/server-sequential-thinking', enabled: false },
]

export function McpSection() {
  const [servers, setServers] = useState(INITIAL_MCP)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [newServer, setNewServer] = useState({ name: '', command: '' })

  const toggle = (id: string) =>
    setServers((list) => list.map((x) => (x.id === id ? { ...x, enabled: !x.enabled } : x)))

  const addServer = () => {
    if (!newServer.name.trim() || !newServer.command.trim()) return
    setServers((list) => [
      ...list,
      { id: newServer.name.toLowerCase().replace(/\s+/g, '-'), name: newServer.name, command: newServer.command, enabled: true },
    ])
    setNewServer({ name: '', command: '' })
    setAddOpen(false)
  }

  const testMcp = (id: string) => {
    setTestingId(id)
    window.setTimeout(() => setTestingId(null), 900)
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="text-[12.5px] font-medium">MCP servers</div>
        <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
          + Add server
        </Button>
      </div>
      <div className="mt-2">
        {servers.map((s) => (
          <div key={s.id} className="flex items-center gap-2.5 py-2.5">
            <div className="min-w-0 flex-1">
              <div className="text-[12.5px] font-medium">{s.name}</div>
              <div className="truncate font-mono text-[11px] text-muted-foreground">{s.command}</div>
            </div>
            {testingId === s.id ? (
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                {spinner}testing
              </span>
            ) : (
              <Button
                variant="ghost"
                size="xs"
                className="h-6 px-1 text-[11px] text-muted-foreground"
                onClick={() => testMcp(s.id)}
              >
                Test
              </Button>
            )}
            {rowSwitch(s.enabled, () => toggle(s.id), `Enable ${s.name}`)}
          </div>
        ))}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogTitle>Add MCP server</DialogTitle>
          <DialogDescription>Connect a local tool over the Model Context Protocol.</DialogDescription>
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Name</label>
              <Input
                value={newServer.name}
                onChange={(e) => setNewServer((s) => ({ ...s, name: e.target.value }))}
                placeholder="My tool"
                aria-label="Server name"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Command</label>
              <Input
                className="font-mono"
                value={newServer.command}
                onChange={(e) => setNewServer((s) => ({ ...s, command: e.target.value }))}
                placeholder="npx -y @modelcontextprotocol/server-…"
                aria-label="Server command"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button variant="default" size="sm" onClick={addServer}>
              Add server
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/* ───────────────────────── Skills (S7) ───────────────────────── */

interface SkillItem {
  id: string
  name: string
  description: string
  enabled: boolean
}

const INITIAL_SKILLS: SkillItem[] = [
  { id: 'research', name: 'Research', description: 'Light web and product research for content decisions — structured notes, not a link dump.', enabled: true },
  { id: 'fashion-image-prompting', name: 'Fashion image prompting', description: 'Flagship generation skill — terminology library, 8 generation rules and per-use case prompts.', enabled: true },
  { id: 'content-manage', name: 'Content manage', description: 'Edit copy, assets and collections — field-level changes, never code.', enabled: true },
  { id: 'theme-tune', name: 'Theme tune', description: 'Restyle within tokens — colors, type and spacing through the theme layer only, with a preview.', enabled: true },
  { id: 'section-add', name: 'Section add', description: 'Add static sections from the pattern library — no new logic.', enabled: true },
  { id: 'site-health-check', name: 'Site health check', description: 'QA report in plain language — contrast, layout at 375/768/1280, broken links and regressions.', enabled: true },
]

export function SkillsSection() {
  const [skills, setSkills] = useState(INITIAL_SKILLS)
  const [addOpen, setAddOpen] = useState(false)
  const [newSkill, setNewSkill] = useState({ name: '', description: '' })

  const enabled = skills.filter((s) => s.enabled).length
  const toggle = (id: string) =>
    setSkills((list) => list.map((x) => (x.id === id ? { ...x, enabled: !x.enabled } : x)))

  const addSkill = () => {
    if (!newSkill.name.trim()) return
    setSkills((list) => [
      ...list,
      { id: newSkill.name.toLowerCase().replace(/\s+/g, '-'), name: newSkill.name, description: newSkill.description, enabled: true },
    ])
    setNewSkill({ name: '', description: '' })
    setAddOpen(false)
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="text-[12.5px] font-medium">
          {enabled} of {skills.length} enabled
        </div>
        <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
          + Add skill
        </Button>
      </div>
      <div className="mt-2">
        {skills.map((s) => (
          <div key={s.id} className="flex items-center gap-2.5 py-2.5">
            <div className="min-w-0 flex-1">
              <div className="text-[12.5px] font-medium">{s.name}</div>
              <div className="truncate text-[11px] text-muted-foreground">{s.description}</div>
            </div>
            {rowSwitch(s.enabled, () => toggle(s.id), `Enable ${s.name}`)}
          </div>
        ))}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogTitle>Add skill</DialogTitle>
          <DialogDescription>A folder with a SKILL.md — the catalog injects it; triggers load it on demand.</DialogDescription>
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Name</label>
              <Input
                value={newSkill.name}
                onChange={(e) => setNewSkill((s) => ({ ...s, name: e.target.value }))}
                placeholder="My skill"
                aria-label="Skill name"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Description</label>
              <Input
                value={newSkill.description}
                onChange={(e) => setNewSkill((s) => ({ ...s, description: e.target.value }))}
                placeholder="What it does and when it triggers"
                aria-label="Skill description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button variant="default" size="sm" onClick={addSkill}>
              Add skill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/* ───────────────────────── Sites (S9, pilot door) ───────────────────────── */

interface Site {
  id: string
  name: string
  repo: string
  connectedAt: string
  lastPublished: string | null
  contentModel: string
}

const PILOT_REPO = 'jussaralee/hand-me-up'

export function SitesSection() {
  const [sites, setSites] = useState<Site[]>([])
  const [connectOpen, setConnectOpen] = useState(false)
  const [authorizing, setAuthorizing] = useState(false)
  const [disconnectId, setDisconnectId] = useState<string | null>(null)

  const authorize = () => {
    setAuthorizing(true)
    window.setTimeout(() => {
      setAuthorizing(false)
      setSites([
        {
          id: 'hand-me-up',
          name: 'Hand-me-up',
          repo: PILOT_REPO,
          connectedAt: 'Just now',
          lastPublished: null,
          contentModel: 'site-content/*.json',
        },
      ])
      setConnectOpen(false)
    }, 900)
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="text-[12.5px] font-medium">{sites.length === 0 ? 'No connected sites' : 'Connected sites'}</div>
        <Button
          variant="outline"
          size="sm"
          className="border-secondary text-secondary hover:bg-secondary/10 hover:text-secondary"
          onClick={() => setConnectOpen(true)}
        >
          + Connect site
        </Button>
      </div>

      {sites.length === 0 ? (
        <p className="py-3 text-sm text-muted-foreground">
          Connect a GitHub repository to publish content from Mitsu. Content-only — code never changes.
        </p>
      ) : (
        <div className="mt-2">
          {sites.map((s) => (
            <div key={s.id} className="flex items-center gap-2.5 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-medium">{s.name}</div>
                <div className="truncate font-mono text-[11px] text-muted-foreground">
                  {s.repo} · {s.contentModel}
                </div>
              </div>
              <span className="text-[11px] text-muted-foreground">
                {s.lastPublished ? `Published ${s.lastPublished}` : 'Not published yet'}
              </span>
              <Button
                variant="ghost"
                size="xs"
                className="h-6 px-1 text-[11px] text-muted-foreground hover:text-destructive"
                onClick={() => setDisconnectId(s.id)}
              >
                Disconnect
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={connectOpen} onOpenChange={setConnectOpen}>
        <DialogContent className="max-w-sm">
          <DialogTitle>Connect a site</DialogTitle>
          <DialogDescription>
            Authorize via GitHub App. Mitsu commits content-only ({'site-content/*.json'}) and never touches code or other paths.
          </DialogDescription>
          <div className="rounded-lg border border-border bg-muted p-2.5 font-mono text-sm text-foreground">{PILOT_REPO}</div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setConnectOpen(false)}>
              Cancel
            </Button>
            <Button variant="default" size="sm" disabled={authorizing} onClick={authorize}>
              {authorizing ? (
                <>
                  {spinner} Authorizing…
                </>
              ) : (
                'Authorize'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={disconnectId !== null} onOpenChange={(o) => !o && setDisconnectId(null)}>
        <DialogContent className="max-w-sm">
          <DialogTitle>Disconnect site?</DialogTitle>
          <DialogDescription>Stops publishing from Mitsu. Published content stays live.</DialogDescription>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setDisconnectId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setSites((list) => list.filter((s) => s.id !== disconnectId))
                setDisconnectId(null)
              }}
            >
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/* ───────────────────────── Memory (S8) ───────────────────────── */

type MemoryType = 'decision' | 'preference' | 'fact' | 'constraint' | 'question'
type MemoryScope = 'user' | 'workspace' | 'project'

interface MemoryItem {
  id: string
  text: string
  age: string
  type: MemoryType
  confidence: number
  scope: MemoryScope
  source: 'auto' | 'manual'
}

const MEMORY_TYPES: MemoryType[] = ['decision', 'preference', 'fact', 'constraint', 'question']

const INITIAL_MEMORIES: MemoryItem[] = [
  { id: 'mem_x7k2', text: 'Mitsu = Mitsumeru. Storybook is the migration vehicle; EVA identity.', age: '2h ago', type: 'fact', confidence: 0.9, scope: 'user', source: 'auto' },
  { id: 'mem_b5v6', text: 'Never ship agency skills (clone-site, story-pointing…) to clients.', age: '2h ago', type: 'constraint', confidence: 0.95, scope: 'user', source: 'auto' },
  { id: 'mem_t8w4', text: 'Does the pilot need project-scoped memory for hand-me-up?', age: '3h ago', type: 'question', confidence: 0.6, scope: 'project', source: 'auto' },
  { id: 'mem_p4q1', text: 'Provider panel: models are chosen in the composer, not settings.', age: '1d ago', type: 'decision', confidence: 0.85, scope: 'project', source: 'auto' },
  { id: 'mem_n2s8', text: 'Keep settings rows separated by spacing, not dividers.', age: '1d ago', type: 'preference', confidence: 0.9, scope: 'user', source: 'manual' },
  { id: 'mem_k1h7', text: 'Use the line variant for panel tabs.', age: '3d ago', type: 'decision', confidence: 0.75, scope: 'workspace', source: 'auto' },
]

export function MemorySection() {
  const [tab, setTab] = useState<'overview' | 'records'>('overview')
  const [memories, setMemories] = useState(INITIAL_MEMORIES)
  const [typeFilter, setTypeFilter] = useState<'all' | MemoryType>('all')
  const [search, setSearch] = useState('')
  const [clearConfirm, setClearConfirm] = useState(false)

  const shown = memories.filter(
    (m) =>
      (typeFilter === 'all' || m.type === typeFilter) &&
      (!search.trim() || m.text.toLowerCase().includes(search.trim().toLowerCase())),
  )

  return (
    <>
      <Tabs value={tab} onValueChange={(v) => setTab(v as 'overview' | 'records')} className="mb-4 w-fit">
        <TabsList>
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="records" className="text-xs">Records</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'overview' ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {MEMORY_TYPES.map((t) => {
            const count = memories.filter((m) => m.type === t).length
            return (
              <div key={t} className="rounded-lg border border-border bg-muted p-3">
                <div className="text-[12.5px] font-medium capitalize">{t}</div>
                <div className="mt-1 text-2xl font-semibold">{count}</div>
                <div className="text-[11px] text-muted-foreground">{count === 1 ? 'record' : 'records'}</div>
              </div>
            )
          })}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Tabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as 'all' | MemoryType)}>
              <TabsList>
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                {MEMORY_TYPES.map((t) => (
                  <TabsTrigger key={t} value={t} className="text-xs capitalize">{t}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search memory…"
              className="h-8 max-w-[220px] text-xs"
              aria-label="Search memory"
            />
            <div className="flex-1" />
            <Button variant="ghost" size="xs" className="text-muted-foreground hover:text-destructive" onClick={() => setClearConfirm(true)}>
              <Trash2 className="size-3" aria-hidden="true" /> Clear all
            </Button>
          </div>

          <div className="mt-3">
            {shown.length === 0 ? (
              <p className="py-3 text-sm text-muted-foreground">No memories match.</p>
            ) : (
              shown.map((m) => (
                <div key={m.id} className="flex items-center gap-2.5 py-2.5">
                  <span className="flex-none rounded bg-muted px-1.5 py-0.5 text-[10px] capitalize text-muted-foreground">
                    {m.type}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12.5px]">{m.text}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {m.age} · {m.scope} · {Math.round(m.confidence * 100)}%
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      <Dialog open={clearConfirm} onOpenChange={setClearConfirm}>
        <DialogContent className="max-w-sm">
          <DialogTitle>Clear all memory?</DialogTitle>
          <DialogDescription>Removes every stored preference, decision and fact. This cannot be undone.</DialogDescription>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setClearConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setMemories([])
                setClearConfirm(false)
              }}
            >
              Clear all
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/* ───────────────────────── Migrate ───────────────────────── */

const MIGRATION_PROMPT = `Write a complete export of everything you know about my project. Include every decision, preference, constraint, deadline, design choice and open question. Be as specific and detailed as possible — use bullet points, don't summarize.

Use these sections: Project Overview / Key Decisions / Design Preferences / Technical Constraints / Deadlines / Facts About Me / Current Context / Contacts.

Start your reply with PROJECT EXPORT.`

export function MigrateSection() {
  const [platform, setPlatform] = useState<'Claude' | 'ChatGPT' | 'Gemini'>('Claude')
  const [copied, setCopied] = useState(false)
  const [migrateText, setMigrateText] = useState('')
  const [migrated, setMigrated] = useState<{ name: string; summary: string } | null>(null)

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(MIGRATION_PROMPT)
    } catch {
      /* clipboard unavailable in some contexts — the box stays selectable */
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  const doMigrate = () => {
    const name = migrateText.split('\n')[0]?.slice(0, 60) || 'Imported project'
    setMigrated({ name, summary: `Imported ${migrateText.length} characters from ${platform} as a new project.` })
  }

  return (
    <>
      <Tabs value={platform} onValueChange={(v) => setPlatform(v as 'Claude' | 'ChatGPT' | 'Gemini')} className="mb-4 w-fit">
        <TabsList>
          {(['Claude', 'ChatGPT', 'Gemini'] as const).map((p) => (
            <TabsTrigger key={p} value={p} className="text-xs">{p}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="rounded-lg border border-border bg-muted p-2.5">
        <div className="text-[12.5px] font-medium">1 · Copy the export prompt</div>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          Paste this into your {platform} conversation; it replies with a PROJECT EXPORT you can import here.
        </p>
        <pre className="mt-2 max-h-[180px] overflow-y-auto whitespace-pre-wrap rounded-md border border-border bg-background p-2.5 font-mono text-[11px] leading-relaxed text-foreground">
          {MIGRATION_PROMPT}
        </pre>
        <div className="mt-2">
          <Button variant="outline" size="sm" className="border-secondary text-secondary hover:bg-secondary/10 hover:text-secondary" onClick={copyPrompt}>
            {copied ? 'Copied' : 'Copy prompt'}
          </Button>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-border bg-muted p-2.5">
        <div className="text-[12.5px] font-medium">2 · Paste the PROJECT EXPORT</div>
        <textarea
          value={migrateText}
          onChange={(e) => setMigrateText(e.target.value)}
          rows={6}
          placeholder="Paste the PROJECT EXPORT here…"
          className="mt-2 w-full rounded-md border border-border bg-background p-2.5 font-mono text-[11px] text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus-visible:ring-3 focus-visible:ring-ring"
          aria-label="PROJECT EXPORT text"
        />
        <div className="mt-2">
          <Button variant="default" size="sm" disabled={!migrateText.trim()} onClick={doMigrate}>
            Import
          </Button>
        </div>
      </div>

      {migrated && (
        <div className={cn('mt-4 rounded-lg border border-border bg-muted p-2.5')}>
          <div className="text-[12.5px] font-medium">{migrated.name}</div>
          <p className="mt-1 text-[11px] text-muted-foreground">{migrated.summary}</p>
        </div>
      )}
    </>
  )
}
