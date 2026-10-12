import { Button } from './Button'
import styles from './ErrorScreen.module.css'

/** Écran affiché quand un écran plante ou qu'un morceau de l'app ne se charge pas (nouvelle version, réseau). */
export function ErrorScreen() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Oups, un souci</h1>
      <p className={styles.text}>
        Cet écran n’a pas pu s’afficher. Souvent, il suffit de recharger l’app (nouvelle version ou
        connexion coupée).
      </p>
      <Button onClick={() => window.location.reload()}>Recharger</Button>
      <a className={styles.link} href="/">
        Retour à l’accueil
      </a>
    </main>
  )
}
