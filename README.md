# Revolty — app installateur (cas d'entretien)

Prototype mobile de l'app de suivi des batteries Revolty pour l'installateur partenaire :
accueil (santé du parc + « À faire »), détail d'un système, données, clôture d'une manip,
nouvelle installation. Expo / React Native, données locales, pas de backend.

Créé à partir du template **ai-project-base** (pratiques : `AGENTS.md`).

## Lancer

```bash
cd installateur
npm install
npx expo start --web      # démo dans le navigateur (format téléphone : 390 × 844)
npx expo start            # Expo Go / simulateur
```

La démo est figée au jeudi 24 septembre 2026, 15:00 (Lyon), puis l'horloge avance en temps
réel. Le **Menu démo** (bas de l'accueil) simule le hors ligne, un échec d'envoi, une coupure
à Bron, le retour d'une panne, et réinitialise la démo.

## Vérifier

```bash
cd installateur
npm test && npm run test:native && npm run typecheck && npm run lint
```

## Documentation

- `docs/specs/2026-09-24-revolty-installateur-design.md` — la spec (comportement).
- `docs/plans/2026-09-24-revolty-installateur.md` — le plan d'implémentation.
- `docs/design/` — la maquette validée (sources Claude Design, tokens).
- `docs/research/` — le benchmark qui a nourri la spec.
- `docs/handoff/` — point de reprise : où on en est, ce qui reste.
