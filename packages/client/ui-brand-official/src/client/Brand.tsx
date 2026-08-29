import type { HeroBrandMarkOwnerProps } from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { SidebarBrandMarkOwnerProps } from '@deepseek-ai/dsh-client-ui-sidebar/client'

type OfficialBrandMarkProps = HeroBrandMarkOwnerProps & SidebarBrandMarkOwnerProps

const MITSU = {
  text: 'var(--dsw-alias-label-primary)',
  dot: '#765898',
}

/**
 * Temporary Mitsu brand mark for localhost review.
 * The mark is hidden in both sidebar and hero; the name/headline own the brand text.
 */
export function OfficialBrandMark(_props: OfficialBrandMarkProps) {
  return null
}

/**
 * Temporary Mitsu sidebar name for localhost review.
 */
export function OfficialBrandName() {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        color: MITSU.text,
        fontFamily: 'Satoshi, ui-sans-serif, system-ui, sans-serif',
        fontWeight: 700,
        fontSize: 20,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      Mitsumeru
      <span
        aria-hidden
        style={{
          fontSize: '1.8em',
          lineHeight: 'normal',
          marginLeft: '0.02em',
          color: MITSU.dot,
        }}
      >
        .
      </span>
    </span>
  )
}
