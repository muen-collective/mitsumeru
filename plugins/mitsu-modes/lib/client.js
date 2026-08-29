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
      if (window.__MITSU_RAIL__ && window.__MITSU_RAIL__.openSurface) {
        if (mode === 'code') window.__MITSU_RAIL__.openSurface('browser')
        if (mode === 'write') window.__MITSU_RAIL__.openSurface('docs')
        if (mode === 'create') window.__MITSU_RAIL__.openSurface('assets')
      }
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
        ctx.slots.inject('conversation.input.dock', () =>
          ctx.slots.register({
            name: 'conversation.input.dock',
            id: 'mitsu-modes',
            order: -100,
          }, ModeTabs))
      },
    }
  },
})
