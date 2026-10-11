import { Link } from 'react-router-dom'
import { Icon } from '../../../core/ui'
import { questProgress } from '../rules/quests'
import { useQuestContext, useQuests } from './questQueries'
import styles from './quests.module.css'

/** Raccourci de l'écran Aujourd'hui : combien de quêtes du jour sont validées, et l'XP encore en jeu. */
export function QuestsLink() {
  const { data: quests } = useQuests()
  const { data: ctx } = useQuestContext()
  if (!quests || !ctx) return null
  const daily = quests.filter((q) => q.period === 'jour')
  const done = daily.filter((q) => q.completed_at !== null).length
  const inPlay = daily
    .filter((q) => q.completed_at === null && questProgress(q, ctx) < q.target)
    .reduce((t, q) => t + q.bonus_xp, 0)
  return (
    <Link to="/taches/quetes" className={styles.todayLink}>
      <Icon name="flag" size={22} />
      <span className={styles.todayLinkText}>
        <span className={styles.todayLinkTitle}>Quêtes du jour</span>
        <span className={styles.sub}>
          {daily.length === 0
            ? 'Crée tes défis du jour'
            : `${done} sur ${daily.length} validées${inPlay > 0 ? ` · +${inPlay} XP en jeu` : ''}`}
        </span>
      </span>
      <Icon name="chevronRight" size={18} />
    </Link>
  )
}
