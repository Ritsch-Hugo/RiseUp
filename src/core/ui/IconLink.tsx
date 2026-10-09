import { Link } from 'react-router-dom'
import { Icon, type IconName } from './Icon'
import styles from './IconButton.module.css'

export function IconLink({ to, icon, label }: { to: string; icon: IconName; label: string }) {
  return (
    <Link to={to} className={styles.round} aria-label={label}>
      <Icon name={icon} size={22} />
    </Link>
  )
}
