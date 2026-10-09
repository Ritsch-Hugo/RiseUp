import { Card } from './Card'

/** Écran provisoire des onglets pas encore construits. */
export function ComingSoon({ name }: { name: string }) {
  return (
    <Card>
      <h2>{name}</h2>
      <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-2)' }}>
        Cet écran arrive dans une prochaine étape.
      </p>
    </Card>
  )
}
