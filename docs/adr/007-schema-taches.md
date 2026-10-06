# ADR-007 : schéma Tâches et gamification
**Statut** : accepté — détail dans `docs/schema.md`

1. Tâche récurrente : à la validation, l'occurrence suivante est créée (nouvelle ligne).
2. XP en journal d'événements append-only ; niveau = somme. Décocher = ligne négative.
3. Boss = tâche `is_boss` dont les sous-tâches portent des PV.
4. Badges : catalogue dans le code ; en base, seulement ceux débloqués.
5. Pauses d'habitude par périodes ; le streak saute les jours en pause.
6. Quêtes **créées par Hugo** : type choisi dans une liste (progression auto, sauf type manuel) + option « reconduire » (recréation auto chaque jour / semaine).
