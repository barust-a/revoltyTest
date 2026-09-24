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
| Plan d'implémentation | ✅ | `docs/plans/2026-09-24-revolty-installateur.md` |
| Proto Expo | ✅ fonctionnel (web + mobile), 287 tests verts | `installateur/` (branche `feat/revolty-installateur`) |
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

## Le proto (état au 24/09 au soir)

- Lancer : `cd installateur && npx expo start --web` (sans `CI=1`, qui coupe le rechargement
  à chaud de Metro). Vue téléphone 390 × 844 dans les outils du navigateur.
- Routes : `/` accueil, `/system/[id]`, `/system/[id]/data`, `/manip/[id]/close`,
  `/install`, `/demo` (menu démo : hors ligne, échec d'envoi, coupure à Bron, retour de la
  panne de Mme Petit, réinitialisation). L'état est persisté (localStorage sur le web) :
  « Réinitialiser la démo » avant chaque prise du Loom.
- Architecture : `core/` pur et testé (santé, parc, À faire, alertes → manips, clôture et
  réconciliation, file d'envoi, mesures simulées, chiffres clés, verdicts, installation) →
  `ports/` → `adapters/` (données de démo, horloge démo, faux serveur, faux GPS / dictée /
  test de communication, caméra expo-camera, haptique) + `state/appStore.ts` → `features/`.
- Écarts assumés (à citer dans la page de notes) : photos, dictée, GPS et test de
  communication simulés (le proto doit tourner sur le web) ; file d'envoi persistée via le
  stockage clé-valeur du template, pas AsyncStorage ; confirmation « Résolu » par la batterie
  simulée à 3 s au lieu de 24 h ; le scénario coupure date le silence de 02:05 (au-delà du
  seuil de 12 h) ; les actions proposées à la clôture sont propres à chaque type de manip.
- Dette connue : `HomeScreen`, `SystemScreen` et `DataScreen` dépassent un peu les ~300
  lignes (360–410) ; l'en-tête teal ne défile pas avec le contenu ; la caméra demande une
  autorisation navigateur (sinon saisie manuelle, prévu).

## Prochaines étapes

1. Relecture du proto par l'utilisateur, puis PR de `feat/revolty-installateur` vers `main`.
2. **Page de notes** : choix et justifications (spec §7), questions à poser à Revolty
   (spec §7, fin), ce qui a été écarté (spec §2), écarts du proto (ci-dessus), benchmark en
   appui. Mentionner que les mascottes viennent de revolty.fr.
3. **Loom 5 min** : réinitialiser la démo, puis accueil chargé → Mme Petit → données
   (frise : montrer le 20 puis le 21) → clôture « Résolu » (confirmation batterie en 3 s) →
   menu démo « Coupure à Bron » → accueil groupé → installation.
4. Guide de smoke-test : **seulement si l'utilisateur le demande**.

## Conventions de travail avec cet utilisateur

- Il écrit parfois en anglais pour s'entraîner : corriger l'anglais en tête de réponse
  (règle globale CLAUDE.md). En français : le signaler en une ligne.
- Questions : l'outil Spokenly n'est pas disponible dans ces sessions → `AskUserQuestion`,
  une question à la fois, option recommandée en premier.
- Commits : docs + maquette sur `main` ; le proto sur `feat/revolty-installateur` (branche
  fixée par la spec).
- Shell de l'utilisateur : `cp` est un alias vers `cd`, `ls` vers eza → `/bin/cp`, `/bin/ls`.
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
