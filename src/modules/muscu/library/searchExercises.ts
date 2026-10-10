const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()

/** Recherche par nom, sans tenir compte des accents ni de la casse ; tous les mots doivent être présents. */
export function searchExercises<T extends { name: string }>(exercises: T[], query: string): T[] {
  const words = normalize(query).split(/\s+/).filter(Boolean)
  if (words.length === 0) return exercises
  return exercises.filter((e) => {
    const name = normalize(e.name)
    return words.every((w) => name.includes(w))
  })
}
