import { useState } from 'react'
import { Button, Card, Sheet } from './core/ui'

// Page de démo temporaire (reproduit « Accueil global » + « Muscu ») pour valider la charte.
export default function App() {
  const [open, setOpen] = useState(false)
  return (
    <main
      style={{
        maxWidth: 430,
        margin: '0 auto',
        padding: 'var(--page-padding)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <h1>Aujourd’hui</h1>
        <span style={{ fontSize: 14, color: 'var(--text-2)' }}>Mardi 6 octobre</span>
      </div>
      <Card style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            background: 'var(--accent-solid)',
            flex: 'none',
            boxShadow: '0 6px 20px rgb(47 123 255 / 0.4)',
          }}
        />
        <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <h2>Muscu</h2>
          <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Séance du jour : Push</span>
        </span>
      </Card>
      <Card large style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 16 }}>Cette semaine</h2>
          <span style={{ fontSize: 13, color: 'var(--text-2)' }}>5 – 11 oct.</span>
        </div>
        <div style={{ display: 'flex' }}>
          {[
            ['3', 'Entraînements'],
            ['3 h 12', 'Durée'],
            ['14 250 kg', 'Volume'],
          ].map(([v, l]) => (
            <div key={l} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span style={{ fontSize: 22, fontWeight: 700 }}>{v}</span>
              <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{l}</span>
            </div>
          ))}
        </div>
      </Card>
      <Button fullWidth>Enregistrer l’exercice</Button>
      <Button variant="secondary" fullWidth onClick={() => setOpen(true)}>
        Ouvrir une feuille
      </Button>
      <Button variant="danger" fullWidth>
        Supprimer
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Feuille">
        <p style={{ color: 'var(--text-2)' }}>Contenu de la feuille.</p>
        <Button fullWidth onClick={() => setOpen(false)}>
          Fermer
        </Button>
      </Sheet>
    </main>
  )
}
