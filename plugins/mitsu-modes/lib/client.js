window.__ModuleLoader__.load({
  id: '@muen/mitsu-modes',
  factory: (require) => {
    const React = require('react')
    const h = React.createElement
    const { useState, useEffect } = React

    const MODES = [
      { id: 'code', label: 'Code' },
      { id: 'write', label: 'Write' },
      { id: 'create', label: 'Create' },
    ]

    const buttons = {
      display: 'flex',
      gap: 24,
      padding: '0 2px',
      fontFamily: 'var(--dsw-font-family)',
    }
    const tab = (active) => ({
      background: 'transparent',
      border: 'none',
      padding: '4px 0',
      cursor: 'pointer',
      fontSize: 13,
      fontWeight: active ? 600 : 400,
      color: active ? 'var(--dsw-alias-label-primary)' : 'var(--dsw-alias-label-secondary)',
      borderBottom: active ? '2px solid var(--mitsu-primary, #765898)' : '2px solid transparent',
    })

    const applyMode = (mode) => {
      window.__MITSU_MODE__ = mode
    }

    const ModeTabs = () => {
      const [mode, setMode] = useState('code')
      useEffect(() => { applyMode('code') }, [])
      const select = (next) => {
        setMode(next)
        applyMode(next)
      }
      return h('div', { style: buttons },
        MODES.map(m => h('button', {
          key: m.id,
          onClick: () => select(m.id),
          style: tab(mode === m.id),
          'aria-pressed': mode === m.id,
          'aria-label': m.label + ' mode',
        }, m.label)))
    }

    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.slots.inject('conversation.hero.agentPreset', () =>
          ctx.slots.register({
            name: 'conversation.hero.agentPreset',
            id: 'mitsu-modes',
            priority: -1,
          }, ModeTabs))
      },
    }
  },
})
