// @muen/mitsu-brand — browser half.
// Loader format: one self-contained script registered via window.__ModuleLoader__.
// React arrives via factory(require), and the DSH slot registry comes from ctx.slots.
window.__ModuleLoader__.load({
  id: '@muen/mitsu-brand',
  factory: (require) => {
    const React = require('react')
    const h = React.createElement

    const BRAND = {
      text: '#0a0a0a',
      dot: '#765898',
      font: 'Satoshi, ui-sans-serif, system-ui, sans-serif',
    }

    const Dot = ({ size = 6 }) =>
      h('span', {
        'aria-hidden': true,
        style: {
          display: 'inline-block',
          width: size,
          height: size,
          marginLeft: '0.2em',
          borderRadius: 999,
          backgroundColor: BRAND.dot,
          verticalAlign: 'baseline',
          transform: 'translateY(-1px)',
        },
      })

    const BrandName = () =>
      h('span', {
        style: {
          color: BRAND.text,
          fontFamily: BRAND.font,
          fontWeight: 700,
          fontSize: 18,
          letterSpacing: '0.02em',
          whiteSpace: 'nowrap',
          display: 'inline-flex',
          alignItems: 'baseline',
        },
      }, 'Mitsumeru', h(Dot, { size: 6 }))

    const SidebarMark = () => null

    const HeroMark = () =>
      h('span', {
        role: 'img',
        'aria-label': 'Mitsumeru brand mark',
        style: {
          color: BRAND.text,
          fontFamily: BRAND.font,
          fontWeight: 700,
          fontSize: 20,
          letterSpacing: '0.02em',
          whiteSpace: 'nowrap',
          display: 'inline-flex',
          alignItems: 'baseline',
        },
      }, 'Mitsumeru', h(Dot, { size: 6 }))

    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.slots.inject('sidebar.brand.mark', () =>
          ctx.slots.inject('sidebar.brand.name', () =>
            ctx.slots.inject('conversation.hero.brand.mark', function* () {
              yield ctx.slots.register({ name: 'sidebar.brand.mark' }, SidebarMark)
              yield ctx.slots.register({ name: 'sidebar.brand.name' }, BrandName)
              yield ctx.slots.register({ name: 'conversation.hero.brand.mark' }, HeroMark)
            })))
      },
    }
  },
})
