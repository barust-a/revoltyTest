# docs/design/ — maquette de l'app installateur Revolty

Maquette haute fidélité produite dans Claude Design à partir de la spec
[`../specs/2026-09-24-revolty-installateur-design.md`](../specs/2026-09-24-revolty-installateur-design.md)
et du benchmark [`../research/2026-09-24-benchmark-apps.md`](../research/2026-09-24-benchmark-apps.md).
C'est la **référence visuelle du proto Expo** : en cas de doute sur un écran, la maquette
fait foi pour le rendu, la spec fait foi pour le comportement.

## Contenu

| Fichier | Rôle |
|---|---|
| `2026-09-24-revolty-maquette-v2.pdf` | Export de la planche (1 page par section). À joindre au rendu / à la page de notes. |
| `maquette-source/Revolty Installateur.dc.html` | La planche : système visuel + 14 écrans rangés en 5 sections. |
| `maquette-source/{Accueil,Systeme,Donnees,Cloture,Installation}.dc.html` | Un fichier par écran, avec ses variantes en props (voir ci-dessous). |
| `maquette-source/revolty.css` | **Tokens et composants partagés** (couleurs, rayons, tailles tactiles, états de santé). Source des tokens du thème Expo. |
| `maquette-source/img/mascotte-*.jpg` | Mascottes batterie reprises de revolty.fr (moments de respiration uniquement). |
| `maquette-source/support.js` | Runtime Claude Design des fichiers `.dc.html` (ne pas modifier). |

## Écrans et variantes (props)

| Repère | Écran | Fichier · prop |
|---|---|---|
| 1a / 1b / 1c | Accueil : journée chargée / hors ligne + coupure groupée / journée calme | `Accueil` · `mode = normal \| offline \| calm` |
| 2a | Détail système (Mme Petit, en panne) | `Systeme` |
| 2b / 2c | Données : Mme Petit hier (anomalie depuis le 21/09) / M. Roux aujourd'hui (trou « en attente de remontée ») | `Donnees` · `system = petit \| roux` |
| 3a / 3b / 3c | Clôture : Résolu / Pas résolu + suite / clôturée et envoyée | `Cloture` · `result = resolu \| pas_resolu \| envoyee` |
| 4a · 4e · 4b · 4c · 4d | Installation étapes 1 à 5 (scan, client, mode, communication, récap) | `Installation` · `step = 1..5` |

Les repères sont stables (4e = étape 2, ajoutée après coup) : ils servent à citer un écran
dans les échanges et les commentaires.

## À réutiliser pour le proto Expo

- **Thème** : reprendre les variables `:root` de `revolty.css` telles quelles
  (`--bg #e8fff3`, `--teal #037168`, `--yellow #fbf59e`, `--primary #11e47a`, états
  `--danger / --warning / --offline`…). Mêmes noms que la section 3.5 de la spec.
- **Graphes de données** : la classe du script de `Donnees.dc.html` contient une
  simulation déterministe (production / conso / batterie / état de charge au pas de 15 min
  sur 8 jours, anomalie de Mme Petit, trou de M. Roux) et le calcul des chiffres clés.
  C'est la base de `generateMeasures`, `dailySummary` et `dayVerdict` dans `core/` — à
  réécrire en TypeScript pur et testé, pas à copier tel quel.
- **Tailles tactiles** : 56 dp minimum, 72 dp pour le bouton du bas, 104 dp pour
  Résolu / Pas résolu.
- **Icônes** : Material Symbols Rounded (noms utilisés dans les `.dc.html`, par ex.
  `bolt`, `donut_large`, `battery_charging_full`, `call`, `cloud_off`).

## Consulter les sources en local

Les `.dc.html` ont besoin du runtime `support.js` à côté d'eux et d'un serveur HTTP :

```bash
cd docs/design/maquette-source && python3 -m http.server 8765
# puis ouvrir http://localhost:8765/Revolty%20Installateur.dc.html
```

## En ligne (Claude Design)

- Planche v2 : <https://claude.ai/design/p/673af18e-48b1-40cc-b230-1b91064ebb60?file=Revolty+Installateur.dc.html>
- Version v1 (sobre, écartée) : même projet, `v1/Revolty Installateur v1.dc.html`.

## Régénérer le PDF

1. Dans Claude Design, obtenir une URL de prévisualisation de la planche
   (`render_preview` → `serve_url`, valable ~1 h, contient un jeton : ne jamais la commiter).
2. Lancer :

```bash
PAGE_URL='<serve_url>' OUT=docs/design/<date>-revolty-maquette-<version>.pdf \
  node tools/design/print-canvas-pdf.mjs
```

Pour rafraîchir `maquette-source/`, télécharger chaque fichier par la même URL de service
puis **supprimer les blocs `data-omelette-injected`** (script d'aperçu injecté qui manipule
le jeton) avant de commiter.
