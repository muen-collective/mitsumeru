# Mitsumeru

Mitsumeru is the Muen product workspace: a lightweight, AI-first system for turning conversations, meetings, and product work into durable, reviewable GitHub artifacts.

## Operating model

- **Discord** is for fast communication, coordination, and voice/video meetings.
- **GitHub** is the source of truth for code, work, decisions, specifications, and deliverables.
- **Mitsu/DSh** records approved Discord meetings, transcribes them locally with OpenAI Whisper, and drafts Markdown notes.
- **AI drafts; humans approve.** No generated meeting note or client commitment is published without review.
- **Vercel** announces deployment status in the private development channel.

## Repository

This is the Muen-owned `Mitsumeru` repository. Client engagements remain in client-owned repositories, where Muen contributes with developer access.

Recommended documentation structure:

```text
docs/
  protocol.md
  goals/
  decisions/
  meetings/
  specs/
  clients/
```

## Meeting workflow

```text
Discord voice channel
  → Claire recording identity
  → Mitsu/DSh plugin
  → local OpenAI Whisper transcription
  → local AI-generated Markdown draft
  → human review
  → commit or pull request
```

Audio and raw transcripts are not committed by default. Client meeting artifacts should normally be published through a pull request.

## Work model

Use three levels only:

- **Goal** — a meaningful outcome.
- **Work item** — a concrete GitHub Issue or pull request.
- **Checklist item** — a small step inside a work item.

The GitHub Project uses:

```text
Inbox → Ready → Doing → Blocked → Done
```

## Local development

See [`docs/development.md`](docs/development.md) for local setup and development instructions.

## Initiative

The communication operating system is documented in [`docs/initiatives/muen-communication-operating-system.md`](docs/initiatives/muen-communication-operating-system.md).
