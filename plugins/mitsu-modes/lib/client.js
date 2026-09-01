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
      borderBottom: active ? '2px solid var(--dsw-alias-state-business-primary)' : '2px solid transparent',
    })

    const applyMode = (mode) => {
      window.__MITSU_MODE__ = mode
      if (window.__MITSU_RAIL__) {
        window.__MITSU_RAIL__.closeAll()
        if (mode === 'write') window.__MITSU_RAIL__.openSurface('write')
        if (mode === 'create') window.__MITSU_RAIL__.openSurface('assets')
      }
    }

    // Shared, subscribe-able mode state so the hero tabs and the active-header
    // tabs stay in sync (both render the same MODES set).
    const listeners = []
    const getMode = () => window.__MITSU_MODE__ || 'code'
    const setMode = (next) => {
      window.__MITSU_MODE__ = next
      applyMode(next)
      for (const fn of listeners) fn(getMode())
    }
    const subscribeMode = (fn) => {
      listeners.push(fn)
      return () => { const i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1) }
    }

    const ModeTabs = () => {
      const [mode, setModeLocal] = useState(getMode())
      useEffect(() => {
        applyMode(getMode()) // establish mode default on mount
        return subscribeMode(setModeLocal)
      }, [])
      const select = (next) => setMode(next)
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
        // Empty-state hero seat.
        ctx.slots.inject('conversation.hero.agentPreset', () =>
          ctx.slots.register({
            name: 'conversation.hero.agentPreset',
            id: 'mitsu-modes',
            priority: -1,
          }, ModeTabs))
        // ACTIVE chat header seat: same tabs, so modes switch mid-session.
        ctx.slots.inject('conversation.session.header.actions', () =>
          ctx.slots.register({
            name: 'conversation.session.header.actions',
            id: 'mitsu-modes-chat',
            order: 5,
          }, ModeTabs))
      },
    }
  },
})
