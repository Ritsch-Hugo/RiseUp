import { useState } from 'react'
import { Button, Icon, Input, Sheet } from '../../../core/ui'
import { REWARD_MAX_LEVEL, REWARD_MIN_LEVEL } from '../config'
import { rewardStatus, suggestRewardLevel, validateRewardForm } from '../rules/rewards'
import { levelFromXp } from '../rules/xp'
import {
  useClaimReward,
  useDeleteReward,
  useRewards,
  useSaveReward,
  type Reward,
} from './rewardQueries'
import styles from '../xp/xp.module.css'

type Editing = { reward: Reward | null; level: string; title: string }

/** Récompenses perso de l'écran Progrès : une par niveau, réclamable une fois le niveau atteint. */
export function RewardsSection({ totalXp }: { totalXp: number }) {
  const { data: rewards = [] } = useRewards()
  const save = useSaveReward()
  const claim = useClaimReward()
  const remove = useDeleteReward()
  const [editing, setEditing] = useState<Editing | null>(null)
  const level = levelFromXp(totalXp).level
  const taken = rewards.map((r) => r.level)

  const openNew = () =>
    setEditing({ reward: null, level: String(suggestRewardLevel(level, taken)), title: '' })
  const close = () => setEditing(null)

  const values = editing
    ? validateRewardForm(
        editing,
        editing.reward ? taken.filter((l) => l !== editing.reward!.level) : taken
      )
    : null

  return (
    <>
      <div className={styles.badgesHead}>
        <h3 className={styles.section}>Récompenses</h3>
        <button type="button" className={styles.addLink} onClick={openNew}>
          + Ajouter
        </button>
      </div>

      {rewards.length === 0 && (
        <p className={styles.cardSub}>
          Choisis ce que tu t’offres en atteignant un niveau : un resto, un jeu, une sortie…
        </p>
      )}
      {rewards.map((r) => {
        const status = rewardStatus(r, totalXp)
        return (
          <div key={r.id} className={styles.rewardCard}>
            <button
              type="button"
              className={styles.rewardMain}
              aria-label={`Modifier la récompense du niveau ${r.level}`}
              onClick={() => setEditing({ reward: r, level: String(r.level), title: r.title })}
            >
              <span className={styles.rewardIcon}>
                <Icon name={status.state === 'locked' ? 'gift' : 'check'} size={22} />
              </span>
              <span className={styles.rewardText}>
                <span className={styles.rewardLevel}>Niveau {r.level}</span>
                <span
                  className={status.state === 'claimed' ? styles.rewardClaimed : styles.cardSub}
                >
                  {r.title}
                </span>
              </span>
              {status.state === 'locked' && (
                <span className={styles.rewardXp}>{status.xpLeft} XP</span>
              )}
              {status.state === 'claimed' && <span className={styles.cardSub}>Réclamée</span>}
            </button>
            {status.state === 'locked' && (
              <div className={styles.rewardTrack}>
                <div style={{ width: `${status.progress * 100}%` }} />
              </div>
            )}
            {status.state === 'ready' && (
              <Button fullWidth disabled={claim.isPending} onClick={() => claim.mutate(r.id)}>
                Réclamer
              </Button>
            )}
          </div>
        )
      })}

      <Sheet
        open={editing !== null}
        onClose={close}
        title={editing?.reward ? 'Modifier la récompense' : 'Nouvelle récompense'}
      >
        {editing && (
          <form
            className={styles.rewardForm}
            onSubmit={(e) => {
              e.preventDefault()
              if (!values) return
              save.mutate({ id: editing.reward?.id, ...values }, { onSuccess: close })
            }}
          >
            <Input
              label="Niveau à atteindre"
              type="number"
              inputMode="numeric"
              min={REWARD_MIN_LEVEL}
              max={REWARD_MAX_LEVEL}
              value={editing.level}
              disabled={editing.reward !== null}
              onChange={(e) => setEditing({ ...editing, level: e.target.value })}
            />
            <Input
              label="Récompense"
              placeholder="Ex. un resto, un nouveau jeu…"
              autoFocus
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
            />
            {editing.reward === null && !values && editing.title.trim() !== '' && (
              <p className={styles.cardSub}>
                Une seule récompense par niveau, entre le niveau {REWARD_MIN_LEVEL} et le niveau{' '}
                {REWARD_MAX_LEVEL}.
              </p>
            )}
            {save.isError && <p className={styles.rewardError}>Impossible d’enregistrer.</p>}
            <Button type="submit" fullWidth disabled={!values || save.isPending}>
              Enregistrer
            </Button>
            {editing.reward && (
              <Button
                variant="danger"
                fullWidth
                disabled={remove.isPending}
                onClick={() => remove.mutate(editing.reward!.id, { onSuccess: close })}
              >
                Supprimer
              </Button>
            )}
          </form>
        )}
      </Sheet>
    </>
  )
}
