import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { TabBar, type Tab } from './TabBar'

const tabs: Tab[] = [
  { to: '/muscu', label: 'Accueil', icon: 'home', end: true },
  { to: '/muscu/profil', label: 'Profil', icon: 'user' },
]

describe('TabBar', () => {
  it('marque seulement l’onglet de la route courante comme actif', () => {
    render(
      <MemoryRouter initialEntries={['/muscu/profil']}>
        <TabBar tabs={tabs} />
      </MemoryRouter>
    )
    expect(screen.getByRole('link', { name: 'Profil' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Accueil' })).not.toHaveAttribute('aria-current')
  })
})
