# @muen/mitsu-providers

Mitsu provider settings plugin.

Replaces DSH’s Models/settings section with the Mitsu provider experience:

- provider search + cards
- API key input with test
- pull models
- image diffusion presets

## Install

```bash
dsh plugin --profile <name> add ./plugins/mitsu-providers
```

The client registers into `settings.section` with id `models`, replacing the
default DSH Models page through the slot system.
