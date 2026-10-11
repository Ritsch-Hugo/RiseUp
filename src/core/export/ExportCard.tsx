import { useState } from 'react'
import { parisDay } from '../dates'
import { Button, Card } from '../ui'
import { exportAll } from './exportData'
import { downloadJson, exportFileName } from './exportFile'
import { ImportSection } from './ImportSection'
import styles from './ExportCard.module.css'

/** Sauvegarde : télécharge toutes les données (Muscu, Nutrition, Tâches) dans un fichier JSON. */
export function ExportCard() {
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')

  const run = async () => {
    setState('busy')
    try {
      downloadJson(await exportAll(), exportFileName(parisDay()))
      setState('done')
    } catch {
      setState('error')
    }
  }

  return (
    <Card className={styles.card}>
      <h2 className={styles.title}>Mes données</h2>
      <p className={styles.text}>
        Télécharge une copie de tout ce que tu as enregistré (séances, repas, tâches…) dans un
        fichier JSON, ou ajoute à tes données le contenu d’un export précédent.
      </p>
      <Button variant="secondary" fullWidth disabled={state === 'busy'} onClick={run}>
        {state === 'busy' ? 'Export en cours…' : 'Exporter mes données'}
      </Button>
      {state === 'done' && <p className={styles.text}>Fichier téléchargé.</p>}
      {state === 'error' && <p className={styles.error}>Impossible d’exporter pour l’instant.</p>}
      <ImportSection />
    </Card>
  )
}
