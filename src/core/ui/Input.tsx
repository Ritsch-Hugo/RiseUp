import { useId, type InputHTMLAttributes } from 'react'
import styles from './Input.module.css'

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label: string }

export function Input({ label, id, className, ...props }: InputProps) {
  const autoId = useId()
  const inputId = id ?? autoId
  return (
    <div className={styles.field}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
      </label>
      <input
        id={inputId}
        className={[styles.input, className].filter(Boolean).join(' ')}
        {...props}
      />
    </div>
  )
}
