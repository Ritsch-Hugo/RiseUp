import { Card } from '../../../core/ui'
import type { MuscleGroup } from '../config'
import { heatColor, type GroupSets } from '../rules/muscles'
import styles from './profile.module.css'

type Paint = (group: MuscleGroup | null) => string

function Front({ paint }: { paint: Paint }) {
  const none = paint(null)
  return (
    <>
      <circle cx="50" cy="14" r="11" fill={none} />
      <rect x="44" y="24" width="12" height="9" rx="3" fill={none} />
      <ellipse cx="31" cy="42" rx="10" ry="9" fill={paint('epaules')} />
      <ellipse cx="69" cy="42" rx="10" ry="9" fill={paint('epaules')} />
      <rect x="38" y="45" width="11" height="17" rx="6" fill={paint('pecs')} />
      <rect x="51" y="45" width="11" height="17" rx="6" fill={paint('pecs')} />
      <rect x="41" y="64" width="18" height="32" rx="7" fill={paint('abdos')} />
      <rect x="15" y="50" width="11" height="27" rx="5.5" fill={paint('biceps')} />
      <rect x="74" y="50" width="11" height="27" rx="5.5" fill={paint('biceps')} />
      <rect x="12" y="80" width="10" height="30" rx="5" fill={none} />
      <rect x="78" y="80" width="10" height="30" rx="5" fill={none} />
      <rect x="37" y="98" width="26" height="12" rx="6" fill={none} />
      <rect x="34" y="112" width="15" height="54" rx="7" fill={paint('quadriceps')} />
      <rect x="51" y="112" width="15" height="54" rx="7" fill={paint('quadriceps')} />
      <rect x="35" y="170" width="12" height="54" rx="6" fill={paint('mollets')} />
      <rect x="53" y="170" width="12" height="54" rx="6" fill={paint('mollets')} />
    </>
  )
}

function Back({ paint }: { paint: Paint }) {
  const none = paint(null)
  return (
    <>
      <circle cx="50" cy="14" r="11" fill={none} />
      <rect x="44" y="24" width="12" height="9" rx="3" fill={none} />
      <ellipse cx="50" cy="38" rx="14" ry="8" fill={paint('dos')} />
      <ellipse cx="31" cy="44" rx="10" ry="8" fill={paint('epaules')} />
      <ellipse cx="69" cy="44" rx="10" ry="8" fill={paint('epaules')} />
      <rect x="37" y="50" width="12" height="30" rx="6" fill={paint('dos')} />
      <rect x="51" y="50" width="12" height="30" rx="6" fill={paint('dos')} />
      <rect x="42" y="82" width="16" height="16" rx="6" fill={paint('dos')} />
      <rect x="15" y="52" width="11" height="26" rx="5.5" fill={paint('triceps')} />
      <rect x="74" y="52" width="11" height="26" rx="5.5" fill={paint('triceps')} />
      <rect x="12" y="80" width="10" height="30" rx="5" fill={none} />
      <rect x="78" y="80" width="10" height="30" rx="5" fill={none} />
      <ellipse cx="42" cy="106" rx="10" ry="9" fill={paint('fessiers')} />
      <ellipse cx="58" cy="106" rx="10" ry="9" fill={paint('fessiers')} />
      <rect x="34" y="118" width="15" height="48" rx="7" fill={paint('ischios')} />
      <rect x="51" y="118" width="15" height="48" rx="7" fill={paint('ischios')} />
      <rect x="35" y="170" width="12" height="54" rx="6" fill={paint('mollets')} />
      <rect x="53" y="170" width="12" height="54" rx="6" fill={paint('mollets')} />
    </>
  )
}

export function BodyCard({ load }: { load: GroupSets }) {
  const paint: Paint = (g) => (g ? heatColor(load[g]) : 'var(--card-2)')
  return (
    <Card large>
      <div className={styles.calHead}>
        <h2 className={styles.cardTitle}>Muscles sollicités</h2>
        <span className={styles.sub}>Cette semaine</span>
      </div>
      <div className={styles.bodies}>
        {[
          { name: 'Face', view: <Front paint={paint} /> },
          { name: 'Dos', view: <Back paint={paint} /> },
        ].map((b) => (
          <figure key={b.name} className={styles.body}>
            <svg
              width="124"
              height="285"
              viewBox="0 0 100 230"
              role="img"
              aria-label={`Silhouette ${b.name.toLowerCase()}`}
            >
              {b.view}
            </svg>
            <figcaption className={styles.sub}>{b.name}</figcaption>
          </figure>
        ))}
      </div>
      <div className={styles.scale} aria-hidden />
      <div className={styles.scaleLabels}>
        <span>Peu sollicité</span>
        <span>Très sollicité</span>
      </div>
    </Card>
  )
}
