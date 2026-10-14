# Rétrospective — Sprint 0

Sprint 0 : du 1er au 15 octobre 2026 (s40 → s42). Réunion de rétrospective le 12 octobre 2026.

Ce document fait le bilan du fonctionnement interne de l'équipe. Le bilan des fonctionnalités livrées est dans la [sprint review](sprint-review.md).

---

## 1. Ce qui a bien marché

- **Aucun retard** : chaque tâche a été terminée dans les temps, et l'équipe est même un peu en avance sur le sprint 1.
- **Bonne cohésion de groupe** : l'ambiance est bonne et l'entraide fonctionne.
- **Être 6** est un avantage : les tâches ont pu avancer en parallèle (authentification, agendas, rendez-vous, calendrier).

---

## 2. Ce qui a moins bien marché

| Problème | Conséquence |
|---|---|
| **Pull requests auto-approuvées** au début du sprint | Du code est arrivé sur `main` sans avoir été relu ni testé par un collègue, ce qui ne respecte pas notre définition de « terminé » |
| **Méthode de relecture floue** : on ne sait pas toujours qui relit quoi, ni ce qu'il faut vérifier | Relectures rapides, problèmes découverts après la fusion |
| **Charge de travail mal répartie** : certains membres ont eu plus de travail que d'autres | Fatigue pour les uns, moins d'implication pour les autres |
| **Trop de mails** | Les messages importants se perdent dans la masse |
| **Manque de coordination** : des tâches ont été commencées sans prévenir le reste de l'équipe | Risque de faire deux fois le même travail ou de se gêner sur les mêmes fichiers |
| **Pas de tests** | On vérifie à la main, et rien ne garantit qu'une fusion ne casse pas une fonctionnalité existante |

---

## 3. Actions pour le sprint 1

| Action | Comment | Lié à |
|---|---|---|
| **Interdire l'auto-merge** | Règle de protection de la branche `main` sur GitHub : une PR ne peut être fusionnée qu'après l'approbation d'au moins une autre personne | PR auto-approuvées |
| **Relecture à deux** | Chaque PR est relue par **2 personnes** : l'une lit le code, l'autre lance l'application et teste la fonctionnalité. Le relecteur est choisi dans la PR (champ *Reviewers*) | Méthode de relecture |
| **Pas de PR si les tests ne passent pas** | Le développeur lance `npm test` avant d'ouvrir sa PR. Les relecteurs refusent une PR dont les tests échouent | Pas de tests |
| **Apprendre à écrire des tests unitaires** | Mise en place des tests au début du sprint (tâche technique du [backlog du sprint 1](../sprint1/backlog-sprint.md)), puis chaque nouvelle fonctionnalité arrive avec ses tests | Pas de tests |
| **Mieux utiliser le GitHub Project** | Toute tâche commencée a une issue, assignée à quelqu'un et placée dans *In progress*. Pas d'issue = on ne commence pas | Coordination |
| **Mieux répartir la charge** | Au sprint planning, on vérifie que chacun a une part de travail comparable avant de valider le sprint | Répartition |
| **Réduire les mails** | Les échanges rapides passent par la messagerie de l'équipe plutôt que par mail. Chacun règle ses notifications GitHub (*Watch* → *Participating and @mentions*) | Trop de mails |

On fera le point sur ces actions à la rétrospective du sprint 1.
