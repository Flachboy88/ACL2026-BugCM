# Rétrospective — Sprint 1

Sprint 1 : s42 → s45. Réunion de rétrospective le 4 novembre 2026.

Ce document fait le bilan du fonctionnement interne de l'équipe. Le bilan des fonctionnalités livrées est dans la [sprint review](sprint-review.md).

---

## 1. Suivi des actions décidées au sprint 0

| Action du sprint 0 | État |
|---|---|
| Interdire l'auto-merge sur `main` | Fait : les PR ne sont plus fusionnées automatiquement |
| Pas de PR si les tests ne passent pas | Fait : une pipeline de test a été introduite |
| Apprendre à écrire des tests | Fait : tests mis en place et documentation ajoutée dans `docs/` |
| Mieux répartir la charge | Fait en théorie, mais déséquilibré par les absences (voir plus bas) |
| Relecture à deux | Partiel : 99 % des fusions ont été faites par 2 personnes seulement, à corriger |

---

## 2. Ce qui a bien marché

- **Une des fonctionnalités les plus importantes du site est livrée** : la récurrence des rendez-vous.
- **Les PR ne sont plus auto-mergées** : l'action du sprint 0 est tenue.
- **Pipeline de test introduite** : les tests tournent avant la fusion.
- **Charge de travail répartie** (en théorie) et **meilleure coordination** qu'au sprint 0.
- Le retard est léger et facilement rattrapable : les tâches qui restent sont simples.

---

## 3. Ce qui a moins bien marché

| Problème | Conséquence |
|---|---|
| **Indisponibilités** : 3 membres sur 6 absents ou partiellement absents (rendez-vous médicaux, travail, alternance) | Quantité de travail réduite sur le projet, 3 fonctionnalités décalées |
| **Léger retard** sur le backlog | Thème sombre, agenda à l'inscription et suppression d'agenda non terminés |
| **Les fusions reposent sur 2 personnes** : 99 % des merges faits par les mêmes membres | Goulot d'étranglement, et la relecture ne tourne pas dans toute l'équipe |

---

## 4. Actions pour le sprint 2

| Action | Comment | Lié à |
|---|---|---|
| **Répartir les relectures et les fusions** | Les autres membres lisent les PR et réalisent les fusions à leur tour, pas seulement 2 personnes | Fusions concentrées sur 2 personnes |
| **Écrire plus de tests** | Chaque nouvelle fonctionnalité arrive avec davantage de tests, au-delà du minimum | Couverture de tests |

On fera le point sur ces actions à la rétrospective du sprint 2.
