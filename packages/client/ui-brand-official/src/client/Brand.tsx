import type { HeroBrandMarkOwnerProps } from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { SidebarBrandMarkOwnerProps } from '@deepseek-ai/dsh-client-ui-sidebar/client'

type OfficialBrandMarkProps = HeroBrandMarkOwnerProps & SidebarBrandMarkOwnerProps

const MITSU = {
  text: '#0a0a0a',
  dot: '#765898',
}

function BrandDot({ size = 6 }) {
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        marginLeft: '0.2em',
        borderRadius: 999,
        backgroundColor: MITSU.dot,
        verticalAlign: 'baseline',
        transform: 'translateY(-1px)',
      }}
    />
  )
}

/**
 * Temporary Mitsu brand mark for localhost review.
 * The sidebar mark slot is hidden; the name slot renders the full wordmark+dot.
 */
export function OfficialBrandMark({ size, className }: OfficialBrandMarkProps) {
  // Sidebar uses size 24; hide the old mark there and let the name slot own
  // the Mitsumeru wordmark+dot. The hero mark (size 34) renders full brand.
  if (size <= 24) return null

  return (
    <span
      role="img"
      aria-label="Mitsumeru brand mark"
      className={className}
      style={{
        color: MITSU.text,
        fontFamily: 'Satoshi, ui-sans-serif, system-ui, sans-serif',
        fontWeight: 700,
        fontSize: 20,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'baseline',
      }}
    >
      Mitsumeru
      <BrandDot size={6} />
    </span>
  )
}

/**
 * Temporary Mitsu sidebar name for localhost review.
 */
export function OfficialBrandName() {
  return (
    <span
      style={{
        color: MITSU.text,
        fontFamily: 'Satoshi, ui-sans-serif, system-ui, sans-serif',
        fontWeight: 700,
        fontSize: 18,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'baseline',
      }}
    >
      Mitsumeru
      <BrandDot size={6} />
    </span>
  )
}
