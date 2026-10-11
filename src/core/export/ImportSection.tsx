import { useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { Button } from '../ui'
import { previewImport, runImport } from './importData'
import { parseImport, totalOf, type ImportPlan } from './importFile'
import styles from './ExportCard.module.css'

type State =
  | { step: 'idle' }
  | { step: 'busy'; label: string }
  | { step: 'ready'; plan: ImportPlan }
  | { step: 'done'; added: number }
  | { step: 'error'; message: string }

/** Import par fusion : lit un export, montre ce qui serait ajouté, puis ajoute seulement ce qui manque. */
export function ImportSection() {
  const queryClient = useQueryClient()
  const input = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<State>({ step: 'idle' })

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setState({ step: 'busy', label: 'Lecture du fichier…' })
    try {
      const parsed = parseImport(await file.text())
      if ('error' in parsed) return setState({ step: 'error', message: parsed.error })
      setState({ step: 'ready', plan: await previewImport(parsed.file) })
    } catch {
      setState({ step: 'error', message: 'Impossible de lire le fichier.' })
    } finally {
      if (input.current) input.current.value = ''
    }
  }

  const confirm = async (plan: ImportPlan) => {
    setState({ step: 'busy', label: 'Import en cours…' })
    try {
      await runImport(plan)
      await queryClient.invalidateQueries()
      setState({ step: 'done', added: totalOf(plan, 'add') })
    } catch (e) {
      setState({
        step: 'error',
        message: `Import interrompu (${e instanceof Error ? e.message : 'erreur'}). Tu peux relancer : ce qui est déjà importé est ignoré.`,
      })
    }
  }

  return (
    <div className={styles.section}>
      <input
        ref={input}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      {(state.step === 'idle' || state.step === 'done' || state.step === 'error') && (
        <Button variant="secondary" fullWidth onClick={() => input.current?.click()}>
          Importer un fichier
        </Button>
      )}
      {state.step === 'busy' && <p className={styles.text}>{state.label}</p>}
      {state.step === 'ready' && (
        <>
          <p className={styles.text}>
            {totalOf(state.plan, 'add')} ligne{totalOf(state.plan, 'add') > 1 ? 's' : ''} à ajouter,{' '}
            {totalOf(state.plan, 'existing')} déjà présente
            {totalOf(state.plan, 'existing') > 1 ? 's' : ''}
            {totalOf(state.plan, 'dropped') > 0 &&
              `, ${totalOf(state.plan, 'dropped')} ignorée${totalOf(state.plan, 'dropped') > 1 ? 's' : ''} (séance en cours ou données manquantes)`}
            . Rien n’est modifié ni supprimé parmi ce que tu as déjà.
          </p>
          <Button
            fullWidth
            disabled={totalOf(state.plan, 'add') === 0}
            onClick={() => confirm(state.plan)}
          >
            {totalOf(state.plan, 'add') === 0 ? 'Rien à ajouter' : 'Ajouter à mes données'}
          </Button>
          <Button variant="secondary" fullWidth onClick={() => setState({ step: 'idle' })}>
            Annuler
          </Button>
        </>
      )}
      {state.step === 'done' && (
        <p className={styles.text}>
          Import terminé : {state.added} ligne{state.added > 1 ? 's' : ''} ajoutée
          {state.added > 1 ? 's' : ''}. Les photos d’exercices ne sont pas dans le fichier.
        </p>
      )}
      {state.step === 'error' && <p className={styles.error}>{state.message}</p>}
    </div>
  )
}
