# @muen/mitsu-brand

Replaces the DeepSeek brand mark in DSH with the Mitsu brand identity:

- `sidebar.brand.mark`
- `sidebar.brand.name`
- `conversation.hero.brand.mark`

Install:

```bash
dsh plugin --profile demo add ./plugins/mitsu-brand
```

The client registers through the DSH slot registry and renders a Mitsumeru/Mitsu
wordmark with a brand dot using inline styles so no extra CSS pipeline is needed.
