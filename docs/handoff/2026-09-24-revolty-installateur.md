# Passation — cas Revolty « app installateur » (24/09/2026)

Point d'entrée pour reprendre le travail après une remise à zéro du contexte.
Lire dans l'ordre : ce fichier → la spec → `docs/design/README.md`.

## Le cas en bref

Entretien 3 chez Revolty (poste de software engineer), **mardi 29/09/2026 à 9h30** avec
Pierre (Product, Hexa) et Romain (CTO). **Rendu la veille, lundi 28/09** : un Loom de
5 min max, le proto (cliquable ou fonctionnel) et une page de notes (choix, questions, ce
qui a été écarté). Énoncé : « 3 à 4 heures, pas plus. Savoir s'arrêter fait partie de
l'exercice. »

- Mail : Gmail, fil « Revolty - entretien 3 » (Mathilde, 24/09).
- Énoncé : <https://catnip-soursop-678.notion.site/Founding-software-engineer-cas-3d3ff42a946680508d8eede92afb66c0>
  (page rendue en JS : l'ouvrir dans un navigateur, WebFetch ne voit rien).
- Utilisateur unique : l'installateur, sur mobile, debout en cave, gants, une main,
  réseau incertain, usage 1 à 2 fois par semaine.

## Où on en est

| Étape (AGENTS.md §1) | État | Où |
|---|---|---|
| Brainstorming + spec | ✅ validée par l'utilisateur | `docs/specs/2026-09-24-revolty-installateur-design.md` |
| Benchmark (14 apps fabricants, dataviz, apps terrain, normes d'alarme) | ✅ intégré à la spec | `docs/research/2026-09-24-benchmark-apps.md` |
| Maquette haute fidélité (v2 « chaleureuse ») | ✅ validée (« tout est parfait ») | `docs/design/` (PDF + sources) · Claude Design |
| Plan d'implémentation | ⏭️ **prochaine étape** | `docs/plans/` (à créer) |
| Proto Expo | à faire | `stacks/` / template RN |
| Page de notes + Loom | à faire (livrables séparés de la spec) | — |

## Décisions clés (détail : spec §7)

- Accueil en **un seul fil** : bandeau santé → « À faire » (urgentes en tête) → parc trié
  par gravité, OK repliés.
- **Alerte grave → manip automatique** après 30 min de grâce, anti-rafale « Coupure
  probable », auto-fermeture ou « à confirmer ». Aucune app fabricant ne le fait : c'est le
  différenciateur, avec le verdict en clair « Anormal depuis… ».
- Données : **hier en détail + frise 8 jours** (remonte à 30 j), 3 graphes empilés sur un
  axe partagé, un trou n'est jamais un zéro (« en attente » vs « perdues »).
- Installation : **n° de série + client (nom, adresse) obligatoires**, mode
  Autoconsommation pré-coché, test de communication en étape passable, jamais bloquant.
- Clôture sur **un écran à gros boutons**, sans clavier, hors ligne avec file d'envoi ;
  « Résolu » déclaré ≠ santé rétablie (confirmation par la batterie sous 24 h).
- Visuel **v2 chaleureuse** (fond menthe, en-têtes teal, jaune pastel, pastilles
  d'icônes, mascotte de revolty.fr dans les moments de respiration). La v1 blanche a été
  jugée triste. Les couleurs de santé restent les plus saturées de l'écran.
- Proto : **Expo fonctionnel sur données locales**, pas de backend. Ordre de coupe si le
  temps manque : Accueil → Clôture → Données → Installation.

## Prochaines étapes

1. **Plan d'implémentation** : skill superpowers `writing-plans` (étape suivante imposée
   par le skill de brainstorming), gabarit `docs/templates/plan-template.md`, tâches TDD
   petites. Reprendre l'architecture de la spec §3.6 (`core/` pur + zod, `ports/`,
   `adapters/`, `state/` zustand, `features/`, `app/` expo-router) et la liste des tests
   de la spec §6.
2. **Proto Expo** : thème = variables de `docs/design/maquette-source/revolty.css` ; la
   simulation des mesures et le calcul des chiffres clés de
   `docs/design/maquette-source/Donnees.dc.html` servent de référence pour
   `generateMeasures` / `dailySummary` / `dayVerdict` (à réécrire en TS testé).
3. **Page de notes** : choix et justifications (spec §7), questions à poser à Revolty
   (spec §7, fin), ce qui a été écarté et pourquoi (spec §2), benchmark en appui, PDF de la
   maquette. Mentionner que les mascottes viennent de revolty.fr.
4. **Loom 5 min** : parcours démo proposé : accueil chargé → Mme Petit → données (frise :
   montrer le 20 puis le 21) → clôture → écran de succès → scénario « coupure » → installation.
5. Guide de smoke-test : **seulement si l'utilisateur le demande**.

## Conventions de travail avec cet utilisateur

- Il écrit parfois en anglais pour s'entraîner : corriger l'anglais en tête de réponse
  (règle globale CLAUDE.md). En français : le signaler en une ligne.
- Questions : l'outil Spokenly n'est pas disponible dans ces sessions → `AskUserQuestion`,
  une question à la fois, option recommandée en premier.
- Commits : l'utilisateur a demandé de **rester sur `main`** pour ce travail
  (docs + maquette). Pour l'implémentation, AGENTS.md prévoit une branche
  `feat/<topic>` : **confirmer avec lui** avant de coder.
- Avant tout commit : `detect_changes` GitNexus (repo `revoltyTest`). L'index GitNexus est
  en retard : lancer `node .gitnexus/run.cjs analyze` avant d'attaquer du code.
- Le hook GateGuard exige, avant la première écriture de chaque fichier (et la première
  commande Bash d'une session), d'énoncer : appelants, doublons éventuels, données, et la
  consigne verbatim de l'utilisateur.

## Ressources externes

- Claude Design, projet « Revolty — App installateur » (id
  `673af18e-48b1-40cc-b230-1b91064ebb60`) :
  <https://claude.ai/design/p/673af18e-48b1-40cc-b230-1b91064ebb60?file=Revolty+Installateur.dc.html>.
  La v1 est dans `v1/` du même projet.
- Régénérer le PDF : `tools/design/print-canvas-pdf.mjs` (mode d'emploi dans
  `docs/design/README.md`).
- Site Revolty : <https://revolty.fr/> — couleurs extraites de sa CSS (spec §3.5).
