import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { addDays, parisDay } from '../../../core'
import { Card, IconLink } from '../../../core/ui'
import { WATER_CHART_DAYS, WATER_QUICK_ADDS } from '../config'
import { useGoalsForDay } from '../goals/goalsQueries'
import { dayLabel, isDay, ringFraction } from '../rules/journal'
import {
  daysReached,
  formatWater,
  parseMl,
  timeLabel,
  totalMl,
  waterStatus,
  weekdayLetter,
  weekTotals,
} from '../rules/water'
import { useAddWater, useRemoveWater, useWater, useWaterWeek } from './waterQueries'
import styles from './water.module.css'

const R = 70
const C = 2 * Math.PI * R
const CHART_W = 318
const CHART_H = 90
const BAR_W = 36

/** Écran Eau d'un jour (`?jour=…`, aujourd'hui par défaut). */
export function WaterPage() {
  const [params] = useSearchParams()
  const today = parisDay()
  const raw = params.get('jour')
  const day = isDay(raw) && raw <= today ? raw : today
  const { data: goals } = useGoalsForDay(day)
  const { data: rows = [] } = useWater(day)
  const { data: weekRows = [] } = useWaterWeek(day)
  const add = useAddWater()
  const remove = useRemoveWater()
  const [custom, setCustom] = useState('')

  const goal = goals?.water_ml ?? 0
  const drunk = totalMl(rows)
  const dash = ringFraction(drunk, goal) * C
  const week = weekTotals(weekRows, day, WATER_CHART_DAYS)
  const scale = Math.max(goal, ...week.map((d) => d.ml), 1)
  const goalY = CHART_H - (goal / scale) * CHART_H
  const step = (CHART_W - BAR_W) / (WATER_CHART_DAYS - 1)
  const last = rows[rows.length - 1]
  const back = day === today ? '/nutrition' : `/nutrition?jour=${day}`

  const addMl = (ml: number) => add.mutate({ id: crypto.randomUUID(), day, ml })
  const customMl = parseMl(custom)
  const onCustom = (e: FormEvent) => {
    e.preventDefault()
    if (customMl === null) return
    addMl(customMl)
    setCustom('')
  }

  return (
    <div className={styles.page}>
      <div className={styles.titleRow}>
        <IconLink to={back} icon="chevronLeft" label="Retour au journal" />
        <h2 className={styles.title}>Eau</h2>
      </div>

      <Card large className={styles.ringCard}>
        <div className={styles.ring}>
          <svg
            width="170"
            height="170"
            viewBox="0 0 170 170"
            role="img"
            aria-label={`${formatWater(drunk)} bus sur un objectif de ${formatWater(goal)}`}
          >
            <circle cx="85" cy="85" r={R} fill="none" stroke="var(--card-2)" strokeWidth="14" />
            <circle
              cx="85"
              cy="85"
              r={R}
              fill="none"
              stroke="var(--accent-2)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${C}`}
              transform="rotate(-90 85 85)"
            />
          </svg>
          <div className={styles.ringCenter}>
            <span className={styles.ringValue}>{formatWater(drunk)}</span>
            <span className={styles.sub}>sur {formatWater(goal)}</span>
          </div>
        </div>
        <span className={styles.status}>{waterStatus(drunk, goal)}</span>
      </Card>

      <h3 className={styles.section}>Ajouter</h3>
      <div className={styles.grid}>
        {WATER_QUICK_ADDS.map((q) => (
          <button key={q.ml} type="button" className={styles.bigQuick} onClick={() => addMl(q.ml)}>
            + {formatWater(q.ml)}
            <span className={styles.sub}>{q.hint}</span>
          </button>
        ))}
      </div>
      <form className={styles.customRow} onSubmit={onCustom}>
        <label className={styles.customField}>
          <span className={styles.srOnly}>Quantité personnalisée en mL</span>
          <input
            inputMode="numeric"
            placeholder="Autre quantité"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
          />
          <span className={styles.sub}>mL</span>
        </label>
        <button type="submit" className={styles.customAdd} disabled={customMl === null}>
          Ajouter
        </button>
      </form>

      <Card>
        <div className={styles.listHead}>
          <h3 className={styles.cardTitle}>
            {dayLabel(day, today, addDays(today, -1)).split(' · ')[0]}
          </h3>
          <button
            type="button"
            className={styles.undo}
            disabled={!last}
            onClick={() => last && remove.mutate(last)}
          >
            Annuler le dernier
          </button>
        </div>
        {rows.length === 0 && <p className={styles.empty}>Rien d’enregistré pour l’instant</p>}
        {[...rows].reverse().map((r) => (
          <div key={r.id} className={styles.logRow}>
            <span className={styles.logTime}>{timeLabel(r.created_at)}</span>
            <span className={styles.logAmount}>+ {r.amount_ml} mL</span>
          </div>
        ))}
      </Card>

      <Card>
        <div className={styles.listHead}>
          <h3 className={styles.cardTitle}>{WATER_CHART_DAYS} derniers jours</h3>
          <span className={styles.sub}>
            objectif atteint {daysReached(week, goal)} jour{daysReached(week, goal) > 1 ? 's' : ''}{' '}
            sur {WATER_CHART_DAYS}
          </span>
        </div>
        <svg
          width={CHART_W}
          height={CHART_H}
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          role="img"
          aria-label={`Eau bue par jour sur ${WATER_CHART_DAYS} jours, objectif de ${formatWater(goal)}`}
        >
          {week.map((d, i) => {
            const h = Math.max(4, (d.ml / scale) * CHART_H)
            return (
              <rect
                key={d.day}
                x={i * step}
                y={CHART_H - h}
                width={BAR_W}
                height={h}
                rx={6}
                fill="var(--accent-2)"
                fillOpacity={i === week.length - 1 ? 1 : 0.45}
              />
            )
          })}
          {goal > 0 && (
            <line
              x1={0}
              x2={CHART_W}
              y1={goalY}
              y2={goalY}
              stroke="var(--text)"
              strokeOpacity={0.6}
              strokeWidth={1.5}
              strokeDasharray="5 5"
            />
          )}
        </svg>
        <div className={styles.letters}>
          {week.map((d) => (
            <span key={d.day}>{weekdayLetter(d.day)}</span>
          ))}
        </div>
      </Card>

      <Link to="/nutrition/stats/objectifs" className={styles.goalRow}>
        <span>Objectif quotidien</span>
        <span className={styles.goalValue}>{formatWater(goal)} ›</span>
      </Link>
    </div>
  )
}
