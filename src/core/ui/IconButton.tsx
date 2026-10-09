import type { ButtonHTMLAttributes } from 'react'
import { Icon, type IconName } from './Icon'
import styles from './IconButton.module.css'

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  icon: IconName
  label: string
}

export function IconButton({ icon, label, type = 'button', ...props }: IconButtonProps) {
  return (
    <button type={type} className={styles.round} aria-label={label} {...props}>
      <Icon name={icon} size={22} />
    </button>
  )
}
