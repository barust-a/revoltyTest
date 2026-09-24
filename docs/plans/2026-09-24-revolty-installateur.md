# App installateur Revolty — plan d'implémentation du proto Expo

> Exécution : tâche par tâche, TDD (rouge → vert → refactor), sur `feat/revolty-installateur`.
> Spec : `docs/specs/2026-09-24-revolty-installateur-design.md` (comportement).
> Maquette : `docs/design/` (rendu ; repères 1a…4e cités ci-dessous).

**Goal :** un proto Expo fonctionnel sur données locales des 5 écrans de la spec (accueil,
système, données, clôture, installation), avec la logique métier réelle testée dans `core/`.

**Architecture :** template `rn-app-practices` : `core/` pur (zod + fonctions déterministes,
testées vitest) → `ports/` → `adapters/` (fixtures, horloge démo, faux serveur d'envoi, scan
caméra) + `state/` (un store zustand) → `features/` (écrans) → `app/` (routes expo-router
minces). Les écrans consomment des « vues » calculées par `core/` : aucun calcul métier en JSX.

**Tech stack :** Expo SDK 57, expo-router, zustand 5, zod 4, react-native-svg + d3-shape
(graphes), expo-camera (scan), expo-haptics, @expo/vector-icons (MaterialIcons),
@expo-google-fonts (Space Grotesk, Inter), vitest + jest-expo.

## Global Constraints

- Couches et pureté : `src/core/**` n'importe ni react, ni expo, ni couche externe ; jamais
  `Math.random`, `Date.now`, ni API dépendante de la locale (`toLocaleString`, `Intl`).
  `architecture.test.ts` et ESLint restent verts.
- Temps : toutes les dates sont des ISO UTC ; le découpage en jours et l'affichage se font en
  heure de Lyon avec un décalage fixe `PARIS_OFFSET_MIN = 120` (démo en septembre, heure
  d'été) défini dans `core/time.ts`. « Maintenant » vient du port `Clock`.
- Horloge démo : `DEMO_NOW = 2026-09-24T13:00:00Z` (jeu. 24 sept., 15:00 à Lyon), qui avance
  ensuite au rythme réel (la confirmation « Résolu » simulée à 3 s doit pouvoir s'écouler).
- Types : `z.infer<typeof XSchema>` uniquement ; `strict` + `noUncheckedIndexedAccess` ; pas
  d'`any` ; pas d'export par défaut hors fichiers de route.
- Textes : tout en français, centralisés dans un `strings.ts` par feature ; tests de
  composants sur le texte exact.
- UI : tokens de `docs/design/maquette-source/revolty.css` (spec §3.5) dans `ui/theme.ts`,
  aucune couleur en dur ailleurs ; cibles ≥ 56 dp, bouton du bas ≥ 72 dp, Résolu / Pas
  résolu ≥ 104 dp ; aucun geste fin ; santé = couleur + icône + libellé ; mascotte
  seulement sur « tout va bien », clôture envoyée, installation créée.
- Seuils (spec §3.2–3.3) : sans nouvelles > 12 h ; grâce alerte → manip 30 min ; anti-rafale
  ≥ 5 systèmes sans nouvelles dans la même heure ; confirmation « Résolu » ≤ 24 h
  (simulée à 3 s) ; 5 cartes max dans « À faire ».
- Chaque commit passe le hook (`lint-staged` + `tsc --noEmit`) ; `--no-verify` interdit ;
  `detect_changes` GitNexus avant chaque commit.
- Ordre de coupe si le temps manque : Accueil → Clôture → Données → Installation.

## Écarts assumés par rapport à la spec (proto)

- File d'envoi persistée via le `StoragePort` existant du template (expo-sqlite kv-store)
  plutôt qu'AsyncStorage : même rôle, zéro dépendance de plus.
- Photos, dictée et géolocalisation **simulées** par des adaptateurs factices (vignettes
  numérotées, transcription fixe ou « mémo audio joint » hors ligne, adresse fixe à Lyon) :
  le proto doit tourner sur le web pour le Loom, où ces API natives manquent. Le scan du
  n° de série utilise la vraie caméra (expo-camera), avec saisie manuelle en secours.
- Tout l'état métier (parc, alertes, manips, file) est persisté pour survivre à un
  rechargement, avec « Réinitialiser la démo » dans le menu démo.

---

### Task 0 : Amorçage du template

**Files :** `git mv stacks/react-native installateur` ; modifier `installateur/app.json`,
`installateur/package.json`, `.husky/pre-commit`, `.github/workflows/ci.yml`, `AGENTS.md`
(§5), `CLAUDE.md` si besoin ; supprimer l'exemple `greeting` et `features/home` du squelette
une fois remplacés.

- [ ] Branche `feat/revolty-installateur` depuis `main`.
- [ ] INIT.md §1–3 : renommage, `__APP_NAME__` → `Revolty Installateur` / slug
  `revolty-installateur` / scheme `revoltyinstallateur`, `prepare` →
  `git -C .. config core.hooksPath .husky`.
- [ ] `npm install`, puis `npx expo install react-native-svg expo-camera expo-haptics
  expo-font @expo/vector-icons @expo-google-fonts/space-grotesk @expo-google-fonts/inter` et
  `npm i d3-shape` + `npm i -D @types/d3-shape`.
- [ ] Gates verts : `npm test && npm run test:native && npm run typecheck && npm run lint`.
- [ ] Commit `chore: bootstrap installer app from ai-project-base`.

### Task 1 : Schémas et temps (`core/types.ts`, `core/time.ts`)

**Interfaces produites :**
- Schémas de la spec §4 : `SystemSchema`, `AlertSchema`, `ManipSchema`, `ClosureSchema`,
  `MeasureSchema`, plus `HealthStatusSchema = z.enum(['en_panne','sans_nouvelles',
  'a_surveiller','ok'])`, `PilotModeSchema`, `ManipTypeSchema`, `SyncStateSchema`.
  `ManipSchema` ajoute `createdAt` et `transmitted: boolean` (badge « Transmise à Revolty ») ;
  `SystemSchema` ajoute `city`, `batteryLabel`, `isNew: boolean`.
- `time.ts` : `HOUR`, `MINUTE`, `DAY` (ms) ; `localDayKey(iso): string` (`'2026-09-21'`) ;
  `dayStartIso(dayKey): string` ; `addDays(dayKey, n): string` ;
  `formatDayShort(dayKey): string` (`'lun. 21 sept.'`) ; `formatClock(iso): string`
  (`'14:05'`) ; `formatAgo(iso, now): string` (`'il y a 12 min'`, `'il y a 14 h'`,
  `'il y a 3 j'`) ; `formatDuration(fromIso, now): string` (`'14 h'`, `'3 jours'`) ;
  `formatDue(iso, now): string` (`"Aujourd'hui"`, `'Demain'`, `'jeu. 1er oct.'`).

**Tests (vitest) :** un objet valide de chaque schéma passe ; `serial` `rv-12` refusé ;
`socPct` 101 refusé ; `localDayKey('2026-09-20T22:30:00Z') === '2026-09-21'` (minuit
passé à Lyon) ; `formatDayShort('2026-09-21') === 'lun. 21 sept.'` ; `formatDue` du 1er
octobre → `'jeu. 1er oct.'` ; `formatAgo` à 12 min / 14 h / 3 j.

### Task 2 : Numéro de série (`core/serial.ts`)

**Interfaces :** `parseSerial(input: string): { ok: true; serial: string } | { ok: false }` ;
`batteryLabel(serial: string): string` (déterministe via `hash32` : 5, 10 ou 15 kWh → 2, 4
ou 6 modules, ex. `'Revolty 10 kWh · 4 modules'`).

**Tests :** `""`, `"RV-"`, `"RV-1234-56789"` → refusés ; `" RV-1234-5678 "` → accepté et
nettoyé ; `"rv-1234-5678"` → accepté, normalisé en majuscules (gants : on ne punit pas la
casse) ; même série → même libellé.

### Task 3 : Santé et parc (`core/health.ts`, `core/park.ts`)

**Interfaces :**
- `deriveHealth(system, activeAlerts: Alert[], now: Date): Health` avec
  `Health = { status: HealthStatus; reason: string | null; since: string | null }`.
- `groupOutages(entries: { system: System; health: Health }[]): { groups: OutageGroup[];
  rest: … }` — `OutageGroup = { systemIds: string[]; since: string }`.
- `sortPark(rows)` ; `buildPark(systems, alerts, now): ParkView` =
  `{ counts: Record<HealthStatus, number>; rows: ParkRow[]; outage: OutageGroup | null;
  okCount: number; allOk: boolean }` (les OK repliés sont dans `rows` avec leur statut,
  la feature décide de l'affichage).

**Tests (spec §6) :** grave + mineure → en_panne ; dernière mesure il y a 12 h 01 →
sans_nouvelles ; 11 h 59 → pas sans_nouvelles ; `lastMeasureAt = null` → sans_nouvelles ;
aucune alerte → ok, `reason = null` ; chaque non-OK porte une raison (« La batterie ne se
recharge plus », « depuis 14 h »). `groupOutages` : 4 dans l'heure → pas de groupe ; 5 → un
groupe ; 5 étalés sur 3 h → pas de groupe. Tri : en_panne > sans_nouvelles > a_surveiller
> ok, stable à égalité (ordre alphabétique du client).

### Task 4 : Manips et « À faire » (`core/todo.ts`, `core/alerts.ts`)

**Interfaces :**
- `isUrgent(manip, alerts, now): boolean` ; `urgencyReason(…): 'alerte' | 'retard' | null`.
- `sortTodo(manips, alerts, now): Manip[]` (urgentes d'abord, puis échéance croissante,
  stable).
- `buildTodo(state, now): TodoView` = `{ cards: TodoCard[] (≤ 5); hiddenCount: number }`,
  `TodoCard` porte verbe (`'Remise en service'`…), client + ville, échéance formatée,
  origine, urgence, mentions (« Résolu tout seul · à confirmer », « Rouverte · le problème
  est revenu », « Transmise à Revolty », « 2ᵉ passage »), état d'envoi.
- `shouldCreateManip(alert, now): boolean` ; `spawnAlertManips(state, now): DomainState`
  (crée les manips `origine = alerte` manquantes, sauf systèmes pris dans une coupure
  groupée).
- `DomainState = { systems; alerts; manips; queue }` (défini ici, schéma zod
  `DomainStateSchema`).

**Tests :** grave depuis 29 min → non ; 30 min → oui ; mineure → non ; lié à grave active
→ urgent ; échéance dépassée d'une minute → urgent ; grave résolue → non urgent ; tri
urgentes puis échéance, stable ; 7 manips → 5 cartes + `hiddenCount = 2` ; pas de doublon
si la manip de l'alerte existe déjà.

### Task 5 : Clôture, réconciliation, file d'envoi (`core/closure.ts`, `core/sync.ts`)

**Interfaces :**
- `applyClosure(state, input: ClosureInput, now, online: boolean): DomainState` —
  résolu → `attente_confirmation` ; pas_resolu → reste `a_faire`, tentative ajoutée
  (« 2ᵉ passage »), `repasser` → échéance demain 18:00 ; `transmettre_revolty` →
  `transmitted = true`. La clôture entre dans la file `en_attente`.
- `reconcileAlerts(state, now): DomainState` — alerte levée : manip jamais ouverte →
  `cloturee` avec tentative `auto_resolue` ; manip ouverte → `a_confirmer` ;
  `attente_confirmation` + alerte levée → `cloturee` ; alerte revenue < 24 h →
  `a_faire` + `reopened` ; > 24 h sans retour → `cloturee`.
- `confirmSelfResolved(state, manipId, now): DomainState`.
- `sync.ts` : `nextToSend(queue)`, `markSending`, `markSent`, `markFailed`, `retry`,
  `pendingCount(queue)`.

**Tests :** tous les cas `applyClosure` / `reconcileAlerts` de la spec §6 ; hors ligne →
`en_attente` ; enchaînement `en_attente → envoi → envoyee` et `envoi → echec → en_attente`
(Réessayer).

### Task 6 : Mesures, trous, chiffres clés, verdict (`core/measures.ts`, `gaps.ts`, `summary.ts`, `verdict.ts`)

**Interfaces :**
- `generateMeasures(profile: MeasureProfile, fromDay, toIso): Measure[]` — pas 15 min,
  déterministe via `hash32(profile.seed + jour)` ; `MeasureProfile = { systemId; seed;
  pilotMode; brokenFrom?: string; silentFrom?: string; lostDays?: string[] }` ; reprend la
  simulation de `Donnees.dc.html` (courbes production / conso, batterie 10 kWh,
  plafond 3,3 kW), charge réseau nocturne 1 h–5 h en mode heures creuses.
- `classifyGaps(measures, lastMeasureAt): Gap[]` — `Gap = { from; to; kind: 'attente' |
  'perdues' }`.
- `dailySummary(measures, dayKey): KeyFigures` — `{ producedKwh; consumedKwh; chargedKwh;
  dischargedKwh; selfSufficiencyPct | null; selfConsumptionPct | null; socMin; socMax;
  incomplete: boolean; coverage: number }` (ratios `null` si journée trouée).
- `dayVerdict(measures, dayKey, pilotMode): Verdict` — `{ kind: 'normal' | 'anormal' |
  'insuffisant'; title; detail }` : anormal si surplus solaire ≥ 2 kWh et chargé < 20 % du
  surplus ; heures creuses : la charge réseau de nuit ne compte jamais contre le verdict ;
  couverture < 50 % → insuffisant.
- `detectAnomalyStart(measures, untilDayKey, pilotMode): string | null` (premier jour de la
  série anormale en cours).
- `dayStrip(measures, lastDayKey, days = 8): StripDay[]` (chargé, déchargé, anormal, trou).

**Tests :** journée complète (totaux cohérents) ; journée trouée → `incomplete`, ratios
`null`, trou non compté à zéro ; valeur cumulée arrivant après un trou → pas de pic (on
masque le premier point après trou) ; journée vide → insuffisant ; batterie arrêtée depuis
J-3 malgré le surplus → `detectAnomalyStart = '2026-09-21'` ; charge nocturne en heures
creuses → normal ; jour nuageux sans surplus → normal ; trou seul ≠ anomalie ; même profil →
mêmes mesures.

### Task 7 : Données de démo (`adapters/fixtures.ts`)

Karim, 20 systèmes autour de Lyon (spec §3.7) : Mme Petit (grave depuis lun. 21 sept. 14:00,
manip « Remise en service » aujourd'hui), M. Garnier (grave « Batterie arrêtée » depuis hier,
manip demain), M. Durand (mineure tore, manip jeu. 1er oct.), M. Roux (dernière donnée
aujourd'hui 01:00, manip Revolty « Rappeler le client » ven. 2 oct.), Mme Lefèvre (heures
creuses, OK), 15 OK dont un avec « Changer un module » en retard et un avec un jour perdu
l'avant-veille ; 7 d'entre eux à Bron pour le scénario « Coupure ».
`scenarioOutage(state, now)` : 7 systèmes de Bron passent sans nouvelles depuis 14:05.

**Tests :** chaque fixture passe son schéma ; `buildPark(fixtures, DEMO_NOW)` → 2 en panne,
1 sans nouvelles, 1 à surveiller, 16 OK ; après `scenarioOutage` → une ligne « Coupure
probable » de 7 systèmes.

### Task 8 : Ports, adaptateurs, store (`ports/`, `adapters/`, `state/appStore.ts`)

- Ports : `Clock { now(): Date }`, `SyncPort { send(item: QueueItem): Promise<void> }`,
  `SerialScannerPort { View: ComponentType<ScannerViewProps> }`, `LocationPort
  { currentAddress(): Promise<string | null> }`, `FieldCapturePort { dictate(online):
  Promise<{ note?: string; audioMemo?: string }> }`, `HapticsPort { success(); error() }`,
  `StoragePort` (existant). `Services` les regroupe.
- Adaptateurs : `clockDemo` (DEMO_NOW + temps écoulé), `syncFake` (latence 1,2 s ; échoue si
  hors ligne ou si « Faire échouer le prochain envoi » est armé), `scannerCamera`
  (expo-camera, `onUnavailable` si permission refusée), `locationFake`, `fieldCaptureFake`,
  `hapticsExpo`, `storageKv` (existant). Fakes de test à côté.
- Store : `DomainState` persisté (`domain.v1`, relu via zod, fallback fixtures + bandeau si
  la file était corrompue), `simulateOffline`, `failNextSend`, `installDraft` persisté ;
  actions `tick()` (spawn + reconcile), `closeManip()`, `confirmSelfResolved()`,
  `createManipFromAlert()`, `completeInstall()`, `flushQueue()`, `retry()`,
  `toggleOffline()`, `triggerOutage()`, `resetDemo()`.

**Tests :** contrat du `SyncPort` factice ; store : `closeManip` hors ligne → élément
`en_attente` puis `flushQueue` en ligne → `envoyee` ; échec → `echec` puis `retry` ;
rechargement d'un état corrompu → fixtures + drapeau `recoveredFromCorruption`.

### Task 9 : Thème et composants partagés (`ui/`)

`theme.ts` (tokens §3.5, rayons, tailles tactiles, typo), polices chargées dans
`app/_layout.tsx`, `Icon`, `Txt` (variantes h1/h2/lbl/meta), `Card`, `HealthBadge`,
`IconPastille`, `PrimaryButton` (72 dp, fixé en bas), `ChoiceButton` (104 dp), `Chip`,
`TealHeader` (+ retour), `SyncBadge`, `Mascot`, `StepProgress`, `Banner`.

**Tests (jest) :** `HealthBadge` affiche icône + libellé pour chaque statut ;
`PrimaryButton` désactivé → `accessibilityState.disabled`.

### Task 10 : Accueil (`features/home/`, `app/index.tsx`) — maquette 1a / 1b / 1c

En-tête teal (« Bonjour Karim », connexion + compteur d'envois, « + Installer »), bandeau
hors ligne, bandeau santé (compteurs touchables qui filtrent, masqués à 0, « Tes 20 systèmes
vont bien » + mascotte), « À faire » (5 cartes + « Voir les N autres »), « Mon parc »
(recherche nom / ville / série, ligne « Coupure probable » dépliable, OK repliés), lien
« Menu démo ». Rafraîchissement : bouton « Actualiser » (tirer pour rafraîchir en plus).

**Tests :** ordre (urgentes d'abord), compteur masqué à 0, ligne groupée après le scénario
coupure, recherche « Bron ».

### Task 11 : Clôture (`features/closure/`, `app/manip/[id]/close.tsx`) — maquette 3a / 3b / 3c

**Tests :** « Clôturer » désactivé sans résultat ; « Pas résolu » affiche « Et maintenant ? »
avec « Je repasse » / « Je transmets à Revolty » ; hors ligne → « Enregistrée · envoi au
retour du réseau » ; en ligne → « Clôturée ✓ » puis « Envoyé ✓ ».

### Task 12 : Détail système (`features/system/`, `app/system/[id]/index.tsx`) — maquette 2a

Alertes (titre, gravité, depuis, « Pour le client », « À vérifier sur place »,
manip liée ou « Créer une manip »), manips en cours, carte Données avec verdict d'hier,
« Appeler le client » (`tel:`).

### Task 13 : Données (`features/data/`, `app/system/[id]/data.tsx`) — maquette 2b / 2c

Verdict, 3 graphes SVG empilés à axe partagé (d3-shape, `defined()` pour les trous, bandes
hachurées « En attente de remontée » / « Données perdues »), curseur au toucher, chiffres clés
2×4, frise 8 jours cliquable + « ◂ Semaine précédente » jusqu'à 30 jours.

### Task 14 : Installation (`features/install/`, `app/install.tsx`) — maquette 4a · 4e · 4b · 4c · 4d

5 étapes, brouillon persisté, scan + saisie manuelle validée en direct, client existant /
nouveau avec adresse pré-remplie, mode pré-coché, test de communication (succès simulé ou
« Passer, vérifier plus tard »), récapitulatif, « Terminer » → accueil, système « Nouveau »
en tête.

### Task 15 : Vérification finale

Gates complets (`npm test && npm run test:native && npm run typecheck && npm run lint`),
lancement web (`npx expo start --web`) et parcours du Loom (handoff §4), mise à jour du
handoff et de `docs/README.md`.
