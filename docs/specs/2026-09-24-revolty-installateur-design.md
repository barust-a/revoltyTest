# App installateur Revolty — accueil, détail système, clôture, installation — Design

Date: 2026-09-24
Status: Draft
Branch: feat/revolty-installateur

Sources : mail « Revolty - entretien 3 » (Mathilde, 24/09/2026), énoncé Notion
« Founding software engineer - cas », thème extrait de la CSS de revolty.fr, benchmark
`docs/research/2026-09-24-benchmark-apps.md` (apps fabricants, dataviz énergie, apps
d'intervention terrain, normes d'alarme).
Entretien : mardi 29/09/2026 9h30 (Pierre, Product chez Hexa ; Romain, CTO). Rendu la
veille (lundi 28/09) : Loom ≤ 5 min + proto + page de notes.

## 1. Purpose

Les boîtes d'installation solaire sont le canal de distribution de Revolty : si elles
n'aiment pas l'outil, elles vendent la batterie du concurrent. On conçoit l'app mobile de
**l'installateur** (l'opérateur qui pose, surveille et dépanne les batteries chez ses
clients) : un écran d'accueil qui montre d'un coup d'œil l'état de son parc et ce qu'il a à
faire, plus trois sous-écrans (détail d'un système, clôture d'une manip, nouvelle
installation). Il n'ouvre l'app qu'une à deux fois par semaine, n'est pas ingénieur, n'a
aucune patience, et l'utilise debout dans une cave, avec des gants, une main prise,
mauvaise lumière et réseau incertain. Succès : il comprend l'état de son parc sans lire,
clôture une manip en 2 min avec des gants et hors ligne, lit la santé d'une batterie en
30 s, crée une installation en 5 min.

Positionnement (issu du benchmark) : on reprend les standards que l'installateur connaît
déjà chez Enphase, SolarEdge, Sungrow, Victron… (4 états dont un « hors ligne » distinct,
parc trié par gravité, compteurs par statut, alertes qui se ferment seules, mise en
service par scan, autoconsommation par défaut) et on se différencie là où aucune app
fabricant ne va : **la liste « À faire » sur l'accueil** (les PME d'installation n'ont pas
de logiciel d'interventions) et **le verdict en clair « Anormal depuis… »**.

Livrables de ce cycle : (1) maquette Claude Design des écrans ci-dessous, (2) proto Expo
fonctionnel sur données locales. La page de notes et le Loom sont hors de cette spec.

## 2. Scope

**In scope**
- Écran d'accueil (bandeau santé + « À faire » + « Mon parc »).
- Détail d'un système (alertes, manips du système, accès aux données).
- Écran des données (3 graphes à axe partagé, chiffres clés, frise 7 jours → 30 jours).
- Clôture d'une manip (un écran, hors ligne supporté).
- Nouvelle installation (5 étapes, test de communication passable).
- États transverses : hors ligne, états d'envoi, liste vide, tout va bien, coupure
  groupée.
- Proto Expo : navigation complète, logique métier réelle, données fictives déterministes,
  scan caméra réel avec saisie manuelle en secours, interrupteur « Simuler hors ligne ».

**Out of scope (explicitement)**
- Écrans du patron et du bureau (interdit par l'énoncé).
- Authentification, multi-comptes, notifications push.
- Backend, API, vraie synchronisation serveur (« pas de code production ready »).
- Mode sombre, internationalisation (tout est en français), historique complet des
  interventions.
- **Écartés après benchmark** (justifiés dans la page de notes) : vue carte (20 systèmes,
  la recherche suffit), flux d'énergie animé en direct (répandu mais ne sert pas le
  diagnostic), signature client (pratique des logiciels de facturation, sans objet ici),
  photos obligatoires à la mise en service (casseraient les 5 min → « plus tard »).
- Page de notes et Loom (livrables séparés).

**Ordre de coupe si le budget (3–4 h) est dépassé** : on garde dans l'ordre
1. Accueil, 2. Clôture, 3. Données, 4. Installation.

## 3. Architecture & structure

### 3.1 Principes UX transverses (s'appliquent à tous les écrans)

- **Cibles tactiles** (en dp/pt) : 56 minimum pour tout élément touchable ; « Résolu » /
  « Pas résolu » ≥ 96 de haut (~18 mm, zone « gants » 15–19 mm) ; bouton primaire en
  pleine largeur, ≥ 72 de haut, fixé en bas ; ≥ 12 d'espacement entre deux cibles ;
  aucune cible collée aux bords gérés par l'OS (geste retour, indicateur d'accueil iOS).
- Texte courant ≥ 17 ; libellés clés et états 19–20 en gras ; chiffres en
  `tabular-nums`.
- **Aucun geste** fin : pas de swipe, pas d'appui long, pas de pinch (gants).
- Action principale en bas, jamais dans un coin ; un seul bouton primaire par écran.
- La santé n'est **jamais portée par la couleur seule** : couleur + icône + libellé
  (WCAG 1.4.1 ; icônes d'état ≥ 3:1, WCAG 1.4.11).
- **Les états de santé sont les couleurs les plus saturées de l'écran** (principe ISA-101) :
  l'état OK reste discret pour que le rouge et l'ambre ressortent. Le décor, lui, reprend
  l'ADN chaleureux de revolty.fr (fond menthe, en-têtes teal, jaune pastel, pastilles
  d'icônes, mascotte) — voir 3.5.
- Langage courant, jamais de code erreur ; dates relatives (« Aujourd'hui »,
  « Jeu. 26 », « depuis 2 j ») ; vocabulaire du marché français (autoconsommation,
  autoproduction, surplus, chargé / déchargé, heures creuses).
- Évidence sans mémoire : pas de réglage à retenir, pas de menu caché.
- Retour haptique réservé aux moments importants : succès ou échec d'une clôture ou
  d'une installation.

### 3.2 Modèle de santé

| État | Rendu | Condition |
|---|---|---|
| En panne | rouge `#D92D20`, icône ⛔, libellé en gras | au moins une alerte active de gravité `grave` |
| Sans nouvelles | gris `#667085`, icône nuage barré « ? », **contour pointillé**, « depuis 14 h » | aucune mesure reçue depuis > **12 h** |
| À surveiller | ambre `#B54708`, icône ⚠ | au moins une alerte active `mineure` |
| OK | **discret** : petite coche teal `#037168`, texte neutre, aucun aplat | sinon |

- Priorité de calcul et ordre de tri : En panne > Sans nouvelles > À surveiller > OK.
- Chaque statut non-OK porte **une ligne de raison** : « En panne · La batterie ne se
  recharge plus », « Sans nouvelles · depuis 14 h ».
- Sans nouvelles ≠ en panne : la batterie continue de fonctionner et garde ses données en
  mémoire ; elles remonteront au retour de la connexion.
- La santé est **dérivée**, jamais stockée.

### 3.3 Règles métier

- **Alerte → manip** : une alerte `grave` **active depuis au moins 30 min** (délai de
  grâce contre les alertes intermittentes) crée automatiquement une manip (origine
  `alerte`). Une alerte `mineure` reste informative sur le système, avec un bouton
  « Créer une manip ».
- **Anti-rafale** : si ≥ 5 systèmes passent « Sans nouvelles » dans la même heure, l'accueil
  les regroupe en une seule ligne « Coupure probable · 7 systèmes sans nouvelles depuis
  14:05 » (dépliable) et aucune manip individuelle n'est créée.
- **Alerte qui disparaît d'elle-même** :
  - manip jamais ouverte par l'installateur → fermée automatiquement (résultat
    `auto_resolue`) ;
  - manip déjà ouverte → **pas de fermeture silencieuse** : elle passe « Résolu tout
    seul · à confirmer », et l'installateur confirme d'un bouton.
- **Urgence** : une manip est urgente si elle est liée à une alerte `grave` active **ou**
  si son échéance est dépassée. Dérivée, jamais stockée.
- **Clôture « Résolu »** : la manip passe « En attente de confirmation par la batterie »
  pendant **24 h au plus**. Si les données confirment (alerte levée), elle est close. Si
  l'alerte revient dans ce délai, la manip **se rouvre automatiquement** avec la mention
  « Rouverte · le problème est revenu ». Dans le proto, la confirmation est simulée après
  3 s.
- **Clôture « Pas résolu »** : la manip reste ouverte, marquée « 2ᵉ passage », tentative
  ajoutée à son historique. Suite choisie par l'installateur : « Je repasse » (nouvelle
  échéance, demain par défaut) ou « Je transmets à Revolty » (la manip reste dans « À
  faire » avec le badge « Transmise à Revolty », sans échéance, jusqu'à la réponse).
- **Verdict des données** : une charge de la batterie la nuit depuis le réseau est
  **normale** en mode « Heures creuses » ; le verdict compare l'énergie chargée au surplus
  solaire disponible (pas des kWh bruts), pour ne pas crier à l'anomalie un jour nuageux.
- **Installation dont le test de communication est passé ou échoue** : l'installation est
  créée avec `configuration = non_verifiee`, et une manip « Vérifier la communication »
  (origine `installation`) est créée automatiquement.
- **Hors ligne et envoi** : toute écriture (clôture, installation) part dans une file
  locale. États visibles sur l'élément et en compteur dans l'en-tête : « En attente
  d'envoi » → « Envoi… » → « Envoyé ✓ » ou « Échec · Réessayer ». Les photos et mémos
  audio partent séparément du texte : la clôture est envoyée même si les photos traînent.
  Tant qu'elle n'est pas envoyée, une clôture reste modifiable.

### 3.4 Écrans

#### A. Accueil (`/`)

1. **En-tête** teal `#037168` : « Bonjour Karim », indicateur de connexion avec
   compteur d'envois en attente, bouton jaune « + Installer ». Hors ligne : bandeau
   gris « Hors ligne · données de 14:32 · 2 clôtures en attente d'envoi ».
2. **Bandeau santé** : 4 compteurs touchables (filtrent le parc) ; un compteur à 0 est
   masqué ; si tout est OK : « ✓ Tes 20 systèmes vont bien ».
3. **À faire** : urgentes d'abord (liseré rouge + badge « URGENT · via alerte » ou
   « URGENT · en retard »), puis par échéance croissante. Carte : verbe d'action (« Vérifier
   le tore »), client + ville, échéance, puce d'origine (Alerte / Revolty / Installation),
   bouton « Clôturer ». Les manips « Résolu tout seul · à confirmer » et « Rouverte »
   portent leur mention. Toucher la carte ouvre le système. Maximum 5 cartes puis « Voir
   les N autres ». Vide : « Rien à faire pour l'instant ».
4. **Mon parc** : champ de recherche (nom, ville, n° de série) ; lignes triées par santé
   (client, ville, statut + ligne de raison) ; ligne groupée « Coupure probable » le cas
   échéant ; les OK repliés en « N systèmes OK ▸ ». Tirer pour rafraîchir.

#### B. Détail d'un système (`/system/[id]`)

1. En-tête : client, adresse, n° de série, état en grand avec sa ligne de raison,
   « Dernière donnée : il y a 12 min » ; boutons « Appeler le client » (`tel:`) et
   « Créer une manip ».
2. **Ce qui ne va pas** : une carte par alerte active — titre en français (« La batterie
   ne se recharge plus »), gravité, « Depuis lun. 21 sept., 14 h (3 jours) », « **Pour le
   client** : plus de secours en cas de coupure, sa facture remonte », « **À vérifier sur
   place** » (2–3 pistes), lien vers la manip liée ou bouton « Créer une manip » (mineure).
   Historique des alertes résolues replié.
3. **Manips en cours** sur ce système, chacune avec « Clôturer ».
4. **Carte Données** : verdict en une phrase (« Hier : la batterie a travaillé
   normalement ✓ » / « Anormal depuis lun. 21 sept. ») → ouvre l'écran données.

#### C. Données d'un système (`/system/[id]/data`)

1. **Verdict** en toutes lettres en tête (ex. « La batterie ne se charge plus alors que
   les panneaux produisent — depuis lun. 21 sept. »), suivi de « Dernière donnée : il y a
   12 min ».
2. **Trois graphes empilés, axe horaire partagé 0 h–24 h**, jour sélectionné :
   - Production (aire ambre `#F5A524`) et conso (trait `#022818`), surplus hachuré
     libellé « Surplus » là où production > conso.
   - Batterie : barres vers le haut = charge (`#11e47a`), vers le bas = décharge
     (`#037168`), axe libellé « ▲ Charge / ▼ Décharge » (les portails constructeurs
     utilisent souvent la convention inverse : le libellé lève l'ambiguïté).
   - État de charge 0–100 %.
   - **Toucher un graphe** place un curseur vertical partagé par les trois graphes, avec
     les valeurs de cette heure (tap simple, pas d'appui long ; zone tactile pleine
     hauteur).
3. **Trous de données**, jamais tracés comme un zéro :
   - après la dernière donnée reçue : bande grise hachurée « En attente de remontée » (la
     batterie garde ses données, elles peuvent encore arriver) ;
   - avant la dernière donnée reçue et jamais remontés : bande grise hachurée « Données
     perdues » ;
   - l'énergie cumulée qui arrive d'un bloc à la fin d'un trou n'est jamais affichée comme
     un pic (elle est répartie sur le trou ou masquée).
4. **Chiffres clés** (grille 2×4) : Produit, Consommé, Chargé, Déchargé (kWh) ;
   Autoproduction (« part de ta conso couverte par le solaire », %), Autoconsommation
   (« part de ta production consommée sur place », %) ; Charge mini / maxi (%) ; Dernière
   donnée. Un total calculé sur une journée trouée porte la mention « incomplet ».
5. **Frise 8 jours** (7 derniers jours + aujourd'hui) : une barre double par jour (chargé ↑ / déchargé ↓), ▲ ambre sur jour
   anormal, jour sans données hachuré, jour sélectionné surligné, SoC limité à mini / maxi
   ; bouton « ◂ Semaine précédente » jusqu'à 30 jours ; repère « Anormal depuis … » posé
   sur la frise.
6. **Défaut** : hier (dernière journée complète, meilleure pour diagnostiquer). Aujourd'hui
   (en cours) sélectionnable en un tap.

#### D. Clôture d'une manip (`/manip/[id]/close`)

Un seul écran défilant, bouton primaire fixé en bas :
1. Rappel : client + intitulé de la manip ; heure d'arrivée enregistrée automatiquement à
   l'ouverture de l'écran.
2. Deux boutons géants « ✓ Résolu » / « ✗ Pas résolu » (≥ 96 dp), **visibles sans
   défiler**. C'est le seul choix obligatoire.
3. « Ce que j'ai fait » : puces multi-sélection de la taille d'un bouton, coche visible,
   selon le type de manip (ex. vérifier le tore → « Tore vérifié », « Tore réorienté »,
   « Tore remplacé », « + Autre »).
4. « 📷 Photo » : jusqu'à 2 photos à la suite sans quitter l'appareil photo, copie gardée
   sur le téléphone.
5. « 🎙 Dicter » : note vocale transcrite, facultative. Si la transcription échoue (bruit,
   hors ligne), **le mémo audio est joint tel quel**. Jamais bloquant.
6. Si « Pas résolu » : étape de suite « Et maintenant ? » — « Je repasse » (nouvelle
   échéance, demain par défaut) ou « Je transmets à Revolty ».
7. Bouton « Clôturer » pleine largeur (désactivé tant que le résultat n'est pas choisi),
   heure de clôture enregistrée, retour haptique.
8. Confirmation : « Clôturée ✓ » ou, hors ligne, « Enregistrée · envoi au retour du
   réseau », puis suivi « Envoi… » / « Envoyé ✓ » / « Échec · Réessayer ».

#### E. Nouvelle installation (`/install`)

Barre de progression 5 étapes ; aide « (?) » par étape ; brouillon conservé si
interruption ; création possible hors ligne (synchronisée plus tard).
1. **Batterie** : viseur de scan de l'étiquette (caméra) + « Saisir à la main » (format
   `RV-XXXX-XXXX`, validé en direct) ; batterie reconnue affichée (« Revolty 10 kWh ·
   4 modules »). *Obligatoire.*
2. **Client** : recherche d'un client existant ou « Nouveau client » : nom + adresse
   *obligatoires* ; téléphone et **email facultatifs mais proposés** (« pour inviter ton
   client dans son app »).
3. **Mode de pilotage** : « Autoconsommation » pré-cochée (standard du marché) ;
   « Secours prioritaire » (garde toujours 30 % pour les coupures) ; « Heures creuses ».
   Une ligne d'explication chacun.
4. **Test de communication** : étape à part entière, lancée automatiquement. Succès :
   « ✓ La batterie communique · charge 54 % ». Échec ou attente : bouton explicite
   « Passer, vérifier plus tard ». **Jamais bloquant.**
5. **Récapitulatif** : ce qui a été créé, ce qui reste à compléter, bouton « Terminer ».

« Terminer » → accueil, nouveau système en tête du parc avec badge « Nouveau ».
Complétable plus tard depuis le système : téléphone et email client, puissance crête PV,
marque d'onduleur, photos du tableau.

### 3.5 Design tokens

| Token | Valeur | Usage |
|---|---|---|
Direction « v2 chaleureuse », validée avec l'utilisateur après revue de la v1 (jugée trop
blanche et triste) : on reprend l'ADN de revolty.fr — aplats pastel, teal, mascotte.

| Token | Valeur | Usage |
|---|---|---|
| `bg` | `#e8fff3` (menthe) | fond d'app, cartes blanches posées dessus |
| `teal` | `#037168` | en-têtes (coins bas arrondis), titres de section, liens, décharge, coche OK |
| `yellow` | `#fbf59e` | moments positifs : bouton « + Installer », bandeau « tout va bien », succès, bloc « Pour le client ». **Jamais à côté de l'ambre « À surveiller ».** |
| `primary` | `#11e47a` | fond des boutons primaires (texte `forest`), charge batterie. **Jamais en texte sur fond clair.** |
| `mintStrong` | `#c4f5d9` | pastilles d'icônes, sélection (puces, options) |
| `tealSoft` | `#cfeee9` | pastilles d'icônes |
| `forest` | `#022818` | texte fort, titres d'écran |
| `card` | `#ffffff` | cartes |
| `text` | `#3f4a5a` | texte courant |
| `textMuted` | `#5f6b7a` | texte secondaire (≥ 17 uniquement) |
| `danger` | `#D92D20` | En panne |
| `warning` | `#B54708` | À surveiller |
| `offline` | `#667085` | Sans nouvelles (avec contour pointillé), hors ligne |
| `solar` | `#F5A524` | production (graphes uniquement) |

**Pastilles d'icônes** (48 dp, coins 14) par type de manip : remise en service ⚡ menthe,
vérifier le tore / rappeler le client jaune, changer un module / vérifier la communication
teal clair.

**Mascotte** (illustrations batterie de revolty.fr, médaillon arrondi) uniquement dans les
moments de respiration : accueil « tout va bien » (lunettes de soleil), clôture envoyée
(pouce levé), installation créée (muscles). Jamais sur un écran de travail (clôture en
cours, alertes, données).

Typographie : Space Grotesk (titres 22–28), Inter (texte 17, libellés clés 19–20 gras).
Rayons : 16 cartes, 16–20 gros boutons, 999 puces. Contraste visé : texte ≥ 7:1 sur les
écrans terrain (lisibilité soleil / lampe frontale), icônes d'état ≥ 3:1 ; le pastel n'est
jamais une couleur de texte.

### 3.6 Proto Expo — couches (template `rn-app-practices`)

```
app/        expo-router : /  /system/[id]  /system/[id]/data  /manip/[id]/close  /install
features/   home/  system/  data/  closure/  install/   (composants d'écran)
state/      store zustand (parc, manips, file d'envoi, simulateOffline)
ports/      SystemsRepository, SyncQueue, SerialScanner, Clock
adapters/   in-memory repository (fixtures), AsyncStorage queue, expo-camera scanner
core/       schémas zod + logique pure (aucun import react/expo, pas de Date.now)
```

Unités de `core/` (chacune : entrée typée → sortie typée, testée en TDD) :
- `deriveHealth(system, activeAlerts, lastMeasureAt, now) → Health` (statut + raison)
- `groupOutages(systems, now) → ParkRows` — anti-rafale « Coupure probable »
- `shouldCreateManip(alert, now) → boolean` — délai de grâce de 30 min
- `isUrgent(manip, alerts, now) → boolean`
- `sortPark(rows) / sortTodo(manips)` — tris décrits en 3.4 A
- `classifyGaps(measures, lastMeasureAt) → Gap[]` — « en attente » vs « perdues »
- `dailySummary(measures, day) → KeyFigures` — trous ignorés, total marqué incomplet,
  pas de pic d'après-trou
- `dayVerdict(measures, day, pilotMode) → Verdict` — normal / anormal / données
  insuffisantes, tolérant heures creuses et météo
- `detectAnomalyStart(measures, until, pilotMode) → Date | null`
- `applyClosure(state, closure, now) → state`, `reconcileAlerts(state, now) → state`
  (auto-fermeture, « à confirmer », confirmation 24 h, réouverture)
- `generateMeasures(systemSeed, days)` — données fictives déterministes via `hash32`

Flux : `adapters` (fixtures) → `ports` → `state` (zustand) → `features` (écrans) ;
les écritures passent par `SyncQueue` (envoi immédiat si en ligne, sinon file persistée,
états en attente / envoi / envoyé / échec).

Graphes : `react-native-svg` + `d3-shape` (gestion native des trous via `defined()`,
compatible web pour le Loom).

### 3.7 Données de démo (fixtures)

Installateur : Karim. 20 systèmes autour de Lyon.
- **Mme Petit** (Lyon 3) — En panne : « La batterie ne se recharge plus » depuis
  lun. 21 sept. ; manip urgente « Remise en service » (via alerte), aujourd'hui.
- **M. Garnier** (Bron) — En panne : « Batterie arrêtée » depuis hier ; manip urgente
  « Remise en service » créée automatiquement (via alerte), demain.
- **M. Durand** (Caluire) — À surveiller : « Mesure de consommation incohérente
  (tore) » ; manip « Vérifier le tore », jeu. 1er oct.
- **M. Roux** (Vienne) — Sans nouvelles depuis 14 h, trou « en attente de remontée »
  visible ; manip Revolty « Rappeler le client », ven. 2 oct.
- **Mme Lefèvre** (Villeurbanne) — OK, en mode « Heures creuses » : charge nocturne depuis
  le réseau, verdict normal (démontre la tolérance heures creuses).
- **15 autres systèmes OK**, dont un avec une manip Revolty « Changer un module » (en
  retard → urgente) et un avec un trou « données perdues » l'avant-veille.
- 30 jours de mesures au pas de 15 min par système.
- Scénario démo « coupure » activable depuis le menu démo : 7 systèmes de Bron passent
  Sans nouvelles → ligne groupée « Coupure probable ».

## 4. Data & boundaries

Schémas zod dans `core/types.ts`, validés à la lecture des fixtures et de la file
AsyncStorage.

```ts
SystemSchema = z.object({
  id: z.string(), serial: z.string().regex(/^RV-\d{4}-\d{4}$/),
  client: z.object({ name: z.string().min(1), address: z.string().min(1),
                     phone: z.string().optional(), email: z.string().email().optional() }),
  pilotMode: z.enum(['autoconsommation', 'secours', 'heures_creuses']),
  configuration: z.enum(['verifiee', 'non_verifiee']),
  lastMeasureAt: z.string().datetime().nullable(),
  installedAt: z.string().datetime(),
})
AlertSchema = z.object({
  id, systemId, severity: z.enum(['grave', 'mineure']),
  title: z.string(), clientImpact: z.string(), checks: z.array(z.string()),
  since: z.string().datetime(), resolvedAt: z.string().datetime().nullable(),
})
ManipSchema = z.object({
  id, systemId,
  type: z.enum(['verifier_tore', 'changer_module', 'remise_en_service',
                'rappeler_client', 'verifier_communication']),
  origin: z.enum(['alerte', 'revolty', 'installation']),
  alertId: z.string().nullable(), dueAt: z.string().datetime(),
  openedByInstaller: z.boolean(),
  status: z.enum(['a_faire', 'attente_confirmation', 'a_confirmer', 'cloturee']),
  reopened: z.boolean(),
  attempts: z.array(ClosureSchema),
})
ClosureSchema = z.object({
  manipId, result: z.enum(['resolu', 'pas_resolu', 'auto_resolue']),
  next: z.enum(['repasser', 'transmettre_revolty']).optional(),  // si pas_resolu
  actions: z.array(z.string()), photos: z.array(z.string()).max(2),
  note: z.string().optional(), audioMemo: z.string().optional(),
  arrivedAt: z.string().datetime(), closedAt: z.string().datetime(),
  sync: z.enum(['en_attente', 'envoi', 'envoyee', 'echec']),
})
MeasureSchema = z.object({
  systemId, at: z.string().datetime(),
  productionW: z.number().nullable(), consumptionW: z.number().nullable(),
  batteryW: z.number().nullable(),      // > 0 charge, < 0 décharge (côté batterie)
  gridW: z.number().nullable(),         // > 0 soutirage, < 0 injection
  socPct: z.number().min(0).max(100).nullable(),
})                                      // null = trou de données, jamais 0
```

Le type de trou (« en attente de remontée » / « perdues ») n'est pas stocké : il se
déduit de la position du trou par rapport à `lastMeasureAt`.

Défaut sûr en cas d'échec de parsing : l'élément invalide est écarté et journalisé ; la
file d'envoi corrompue est vidée avec un bandeau « Certaines clôtures n'ont pas pu être
récupérées ».

## 5. Error handling

| Échec | Où | Ce que voit l'installateur |
|---|---|---|
| Pas de réseau | `SyncQueue` | bandeau « Hors ligne · données de HH:MM » ; écritures « En attente d'envoi » |
| Envoi échoué | `SyncQueue` | « Échec · Réessayer » sur l'élément, compteur dans l'en-tête |
| Caméra refusée / scan illisible | `SerialScanner` | bascule directe sur « Saisir à la main » |
| N° de série au mauvais format | étape 1 installation | message en ligne « Format attendu : RV-1234-5678 » |
| Test de communication échoue | étape 4 installation | « Passer, vérifier plus tard » ; installation « Non vérifiée » + manip auto |
| Transcription vocale échoue | clôture | mémo audio joint tel quel, aucun blocage |
| Coupure réseau touchant plusieurs sites | accueil | une ligne « Coupure probable », pas de rafale de manips |
| Journée sans données | écran données | verdict « Données insuffisantes pour ce jour », bande hachurée |
| Fixture / file invalide | adapters | élément écarté, bandeau si perte de clôtures |

## 6. Testing

TDD sur `core/` (vitest), cas limites inclus :
- `deriveHealth` : grave + mineure → En panne ; aucune mesure depuis 12 h 01 → Sans
  nouvelles ; 11 h 59 → pas Sans nouvelles ; `lastMeasureAt = null` → Sans nouvelles ;
  aucune alerte → OK ; la raison est renseignée pour chaque statut non-OK.
- `groupOutages` : 4 systèmes Sans nouvelles dans l'heure → pas de groupe ; 5 → une ligne
  groupée ; 5 étalés sur 3 h → pas de groupe.
- `shouldCreateManip` : alerte grave depuis 29 min → non ; 30 min → oui ; mineure → non.
- `isUrgent` : liée à alerte grave active ; échéance dépassée d'une minute ; alerte grave
  résolue → non urgente.
- `sortPark` / `sortTodo` : ordre de santé, urgentes puis échéance, stabilité à égalité.
- `classifyGaps` : trou après `lastMeasureAt` → en attente ; trou avant → perdues.
- `dailySummary` : journée complète ; journée avec trou (total marqué incomplet, pas
  compté à zéro) ; énergie arrivée d'un bloc après un trou → pas de pic ; journée vide.
- `dayVerdict` / `detectAnomalyStart` : batterie qui ne charge plus malgré le surplus
  depuis J-3 → « depuis lun. 21 sept. » ; charge nocturne réseau en mode heures creuses →
  normal ; jour nuageux sans surplus → normal ; trou seul ≠ anomalie.
- `applyClosure` : résolu → attente_confirmation ; pas résolu → 2ᵉ passage + suite ;
  hors ligne → sync en_attente.
- `reconcileAlerts` : alerte levée, manip jamais ouverte → auto_resolue ; manip ouverte →
  a_confirmer ; attente_confirmation + alerte levée → cloturee ; alerte revenue < 24 h →
  rouverte ; > 24 h sans retour → cloturee.
- Validation du n° de série : `""`, `"RV-"`, `"rv-1234-5678"`, `"RV-1234-56789"`,
  espaces autour.
- Test d'architecture du template (`core/` pur) maintenu vert.

Composants : tests légers sur l'accueil (ordre d'affichage, compteur masqué à 0, ligne
groupée) et la clôture (bouton désactivé sans résultat, suite affichée si pas résolu).
Validation manuelle via un guide de smoke-test à la demande.

## 7. Open questions / decisions taken

Les quatre zones laissées ouvertes par l'énoncé :

| Question | Décision | Alternatives écartées |
|---|---|---|
| Accueil : cohabitation parc / à faire | Un seul fil : bandeau santé → À faire (urgentes en tête) → parc trié, OK repliés | Deux onglets (l'un cache l'autre, exige de la mémoire) ; manips dans les cartes du parc (perd la vue « quoi aujourd'hui ») |
| Alerte → to-do | Auto pour les alertes graves après 30 min de grâce, anti-rafale, auto-fermeture si jamais ouverte sinon « à confirmer » ; mineures informatives + « Créer une manip » | Tout auto (bruit, liste ignorée) ; tout manuel (une alerte grave oubliée par un utilisateur non quotidien). Aucune app fabricant ne crée de tâche : c'est un choix de différenciation |
| Données : fenêtre | Hier en détail + frise 7 jours, remontable jusqu'à 30 jours par « Semaine précédente » ; repère « Anormal depuis » automatique | 7 jours continus + sélecteur (illisible en portrait, réglage de trop) ; 3 jours fixes (ne répond pas à « depuis quand »). Le marché ouvre sur « aujourd'hui » ; on ouvre sur une journée complète, plus utile au diagnostic, avec aujourd'hui à un tap |
| Configuration : obligatoire | N° de série + client (nom, adresse) ; email proposé ; mode pré-coché ; test de communication en étape passable | Série seule (parc de batteries sans client) ; tout obligatoire + test bloquant (> 5 min, bloqué en cave) |

Autres décisions :
- Clôture sur un seul écran à gros boutons, sans clavier (dictée avec repli audio), file
  hors ligne avec états d'envoi — contre un assistant en 4 étapes (trop de touches) ou un
  formulaire (clavier + gants).
- « Résolu » déclaré ≠ santé rétablie : confirmation par les données sous 24 h, sinon
  réouverture (modèle Résolu → Clos des outils de ticketing).
- « Sans nouvelles » en gris comme chez Sungrow / FoxESS / Hoymiles, mais avec contour
  pointillé et durée, parce qu'en ISA-101 le gris signifie « normal ».
- Thème clair « chaleureux » (fond menthe, en-tête teal, jaune pastel, mascotte) — contre
  une v1 blanche et sobre jugée triste et loin de la marque, contre le sombre (illisible en
  plein soleil) et le double thème (coût sans valeur pour le test). Les pastels restent des
  fonds, jamais des couleurs de texte ni d'état.
- Graphes empilés à axe partagé plutôt qu'un graphe unique à double axe (bonne pratique
  dataviz) ; batterie signée côté batterie avec axe libellé.
- Proto Expo fonctionnel sur données locales — contre un cliquable (montre peu d'ingé)
  ou un backend (hors budget, « pas production ready »).

Questions à poser à Revolty (pour la page de notes) :
- Au-delà de quel délai sans données un système doit-il passer « Sans nouvelles » ? (12 h
  retenu, comme Enphase.)
- La batterie garde-t-elle ses données en mémoire pendant une coupure, et combien de
  temps ? (Conditionne « en attente de remontée » vs « perdues ».)
- La batterie remonte-t-elle elle-même des codes d'anomalie, ou faut-il les déduire des
  mesures (comme `dayVerdict` le fait ici) ?
- Quelles manips Revolty crée-t-elle côté siège, et avec quelle échéance ?
- Quels modes de pilotage existent réellement, et lequel est le bon défaut ?
- « Je transmets à Revolty » : quel est le canal de support attendu ?
- L'installateur travaille-t-il seul, ou plusieurs techniciens partagent-ils le parc ?
