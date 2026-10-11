# Règles métier

Toutes les valeurs sont des constantes dans `src/modules/<module>/config.ts`. Chaque règle = fonction pure testée (Vitest). Jours et semaines en heure de Paris, semaine du lundi au dimanche.

## Muscu
- **1RM estimé** (Epley) : `poids × (1 + reps / 30)`, seulement pour 1 à 12 reps, hors échauffement. 1 rep → 1RM = poids.
- **Records par exercice** : charge max, meilleur 1RM estimé, meilleure série (poids × reps), reps max si poids = 0.
- **Volume** : Σ poids × reps hors échauffement. Par muscle : 100 % groupe principal, 50 % secondaires.
- **Muscles sollicités** (0 → 1) : séries effectives sur la semaine (1 principal, 0,5 secondaire) / 15, plafonné à 1. Seuil réglable.
- **Récupération** : temps nécessaire = 12 h + 4 h × séries effectives de la dernière séance sur ce muscle, plafonné à 48 h. Prêt quand écoulé ; sinon heures restantes. Indicatif.
- **Prochaine séance** : la séance type qui suit, dans l'ordre du programme, la dernière séance type effectuée (retour à la première après la dernière). Sans historique, ou si la séance a été supprimée : première séance du premier programme. Les séances libres sont ignorées.
- **Séance comptée** : terminée avec ≥ 1 série hors échauffement.
- **Streak** : semaines consécutives avec séances ≥ objectif (3 par défaut). La semaine en cours ne casse pas le streak.

## Nutrition
- **Valeur d'une entrée** = valeur pour 100 g × quantité / 100.
- **kcal** : celles de l'aliment ; si absentes (aliment perso) : P × 4 + G × 4 + L × 9.
- **Sel** : si seul le sodium est connu, sel = sodium × 2,5.
- **Repas enregistré** = somme de ses aliments.
- **Répartition des macros** en % des calories (P × 4, G × 4, L × 9).
- **Jour suivi** : ≥ N créneaux sur 4 avec une entrée (N = 1, 2 ou 3, défaut 2 ; la collation compte).
- **Streak** : jours suivis consécutifs ; aujourd'hui ne casse pas avant minuit. L'eau n'en fait pas partie.
- **Moyennes** (7 j, 30 j, 3 mois) : sur les jours suivis uniquement, avec « sur X jours suivis ».
- **Dans l'objectif** (stats calories) : jour suivi dont les calories sont à ± 5 % de l’objectif de ce jour (choix de Hugo). Aujourd'hui est exclu des moyennes et des comptes (saisie en cours).
- **Affichage** : dépassement > 100 % sans rouge, sauf le sel.

## Tâches
- **XP tâches** : facile 10, moyen 25, difficile 50. Sous-tâches : 0 (sauf boss).
- **XP habitudes** : facile 10, moyen 15, difficile 25. Compteur : XP seulement si objectif atteint.
- **Niveaux** : XP pour passer de n à n+1 = max(100, 100 × (n − 1)). Niveau = calculé depuis la somme du journal d'XP.
- **Rangs** : Débutant 1-4, Régulier 5-9, Discipliné 10-14, Acharné 15-19, Élite 20-29, Légende 30+.
- **Anti-triche** (facteur appliqué et stocké dans `taches_xp_events.factor`) :
  - tâches faciles du jour : de la 6e à la 10e ×0,5, au-delà ×0 ;
  - tâche créée et terminée en moins de 5 min : ×0,5 ;
  - même titre (normalisé) validé dans les 24 h : ×0,5 (tâches récurrentes exclues) ;
  - facteurs cumulables (multipliés) ; décocher / recocher ne double pas l'XP.
- **Quêtes** : bonus fixe +20 XP (jour), +75 XP (semaine), non réglable par l'utilisateur.
- **Boss** : +10 XP par étape, +150 XP à la victoire. Non battu en fin de semaine : s'échappe, sans pénalité.
- **Streak d'habitude** : jours prévus consécutifs faits ; jours non prévus et en pause ignorés ; aujourd'hui ne casse pas avant minuit.
- **Récompense perso** : une par niveau, réclamable une fois le niveau atteint.
- **Quêtes (Hugo, 11 oct.)** : 5 types (N tâches avec filtre de difficulté optionnel, N tâches d'une catégorie, N habitudes d'un moment, N habitudes, manuelle) ; bonus fixes +20 (jour) / +75 (semaine) ; progression calculée depuis les données de la période ; une quête atteinte est validée une seule fois, et dé-validée (ligne d'XP négative) si l'objectif n'est plus atteint ; « reconduire » recrée la quête à chaque nouvelle période.
- **Série du badge « Série N j »** : jours actifs consécutifs (au moins une tâche terminée ou une habitude validée, heure de Paris) ; aujourd'hui ne casse pas la série avant minuit.
- **Taux de réussite (écran Progrès)** : tâches arrivées à échéance sur les 30 derniers jours qui ont été terminées (définition de Claude, à valider).
- **Anti-triche** : les règles « créée et terminée en moins de 5 min » et « même titre » ne s'appliquent pas aux tâches récurrentes.
- **XP des habitudes** : une seule fois par habitude et par jour, à la validation ; décocher (ou repasser sous l'objectif d'un compteur) annule l'XP du jour.

