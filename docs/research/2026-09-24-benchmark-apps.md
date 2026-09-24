# Benchmark — apps installateur, dataviz énergie, apps d'intervention terrain

Date : 2026-09-24 · Sert la spec `docs/specs/2026-09-24-revolty-installateur-design.md`
et la page de notes du rendu.

Méthode : recherche web (docs officielles, manuels PDF, fiches stores, forums
installateurs, normes via résumés secondaires) sur trois axes. Limites : plusieurs pages
officielles inaccessibles (Tesla, SolarEdge, Huawei, Zebra, Salesforce en 403 ou rendu
JS) — ce qui n'a pas pu être vérifié est marqué *(non vérifié)*. Les chiffres ISA-101 /
ISA-18.2 viennent de résumés secondaires (normes payantes).

## En une phrase

On s'aligne sur les standards que l'installateur connaît déjà (4 états dont « hors
ligne » distinct, parc trié par gravité, compteurs par statut, alertes auto-fermantes,
mise en service par scan, autoconsommation par défaut, vue Jour, vocabulaire FR) et on se
différencie là où aucune app fabricant ne va : **liste « À faire » sur l'accueil** et
**verdict en clair « Anormal depuis… »**.

## 1. Apps installateur des fabricants

| App | Accueil parc | Modèle d'alerte | Mise en service | À noter |
|---|---|---|---|---|
| Enphase (Installer Portal + App) | « Fleet Status » : Normal (vert) / Investigate (ambre, inclut « not reporting ») / Needs Attention (rouge) ; Overview, Map, liste | « Gateway Not Reporting » après 12 h, colonne « Last Report », sous-statut explicatif | 6 étapes : détails système → scan → config → **pré-check connectivité auto** → provisioning → validation ; **défaut Self-Consumption** ; rapport partageable | Ancien Installer Toolkit hors ligne ; avis : mise en service passée de 20 min à ~1 h |
| Tesla One | *(non vérifié)* | alertes à traiter pour finir la mise en service | scan QR → Wi-Fi + « Test Connection » → firmware → grid code → backup test ; **email client obligatoire** | 3,0/5 App Store |
| SolarEdge (SetApp, Go, Monitoring) | liste triée par **impact d'alerte** + carte | impact 1–9, open / muted / closed, **auto-fermeture ≤ 2 h**, « mute jusqu'au… » | scan QR → bouton P → Wi-Fi → assistant ; rapport | plaintes : firmware forcé |
| Huawei FusionSolar | liste de centrales *(statuts non vérifiés)* | alarmes avec cause + **« handling suggestions »** | scan / saisie SN → grid code → **mode batterie** → réseau → centrale → compte propriétaire → contrôle état | |
| Victron VRM | **alarmes en haut**, « vu il y a > 3 mois » en bas ; tags, carte | « no data » avec « Notify after » réglable ; notification de retour à la normale ; **rate limiting 24 h** | hors périmètre | |
| Sungrow iSolarCloud | pastilles **gris = Offline**, orange = Alarm, rouge = Fault | Active / History, « Batch close » manuel | création centrale → scan dongle → Wi-Fi → init ; email propriétaire * ; **GPS auto** | |
| Hoymiles S-Miles | compteurs dont nb en alarme ; filtres statut / nom / SN | Offline, Alarm, **Unfinished**, **Inactive (> 6 mois)**, **SN Does Not Match** ; « Troubleshooting Suggestion » | scan SN du DTU | |
| FoxESS FoxCloud 2.0 | filtres **All / Normal / Faulty / Offline**, carte, tags | Current / History | scan → Wi-Fi → centrale → invitation client email / QR | |
| GivEnergy | normal / alert / waiting / lost | | 7 étapes dont **3 photos imposées** (installation, disjoncteur, position CT) | |
| SMA (360° + Sunny Portal) | *(non vérifié)* | Error / Warning / Info, cycle Incoming / Existing / **Outgoing** | scan QR, invitation client | 3,2/5 |
| Fronius | offline = coupure de connexion, **l'onduleur produit et tamponne** | service messages auto | 3 étapes, scan QR | |

**Standards de fait** : 4 états avec Offline gris distinct de la panne (Sungrow, FoxESS,
Hoymiles, GivEnergy — seul Enphase met « not reporting » en ambre) ; tri par gravité ;
compteurs / filtres par statut ; « dernière remontée » + seuil (12 h Enphase) ; alertes
actives séparées de l'historique et auto-fermantes ; conseil d'action par alerte ;
mise en service scan → Wi-Fi → test de connexion → firmware → invitation client.
**Aucune app ne crée automatiquement de tâche d'intervention.**

## 2. Dataviz énergie (solaire + batterie)

| App | Graphe | Fenêtre / navigation | Trous | KPIs |
|---|---|---|---|---|
| Tesla | flux animé ; un graphe par composant ; Powerwall décharge + / charge − ; SoC séparé | **Jour** ; J / M / A / Vie ; scrub appui long | ? | Self-Powered |
| Enphase | barres horaires colorées par source ; batterie décharge + | aujourd'hui ; J / S / M / A / perso | panneaux gris « aucune énergie reportée », remontée différée | indépendance, dépendance réseau ; FR « Chargé / Déchargé » |
| SolarEdge | flux + « Energy Balance » ; SoC séparé, **masqué > 1 semaine** | ? | « No data does not mean no production » | autoconsommation |
| Victron VRM | barres kWh + **SoC en double axe** | heure → perso | données tamponnées puis renvoyées | SoC |
| SMA Energy | bilan en deux moitiés : **d'où vient la conso / où va le PV** | Courant / J / M / A / Total | **enveloppe grise seulement si incomplet** | autarcie, autoconsommation |
| Home Assistant | sources au-dessus, charge batterie et export sous l'axe ; Sankey | aujourd'hui, « comparer » | **pic artificiel après un trou** | autosuffisance |
| Sunology STREAM | historique charge / décharge | live → J / S / M / A | ? | **taux d'autonomie**, autoconsommation |
| MyLight150, Beem | synthèse simple | derniers jours / J / S / M / A | ? | autoconsommation, € |

**Standards de fait** : flux en direct sur l'accueil (absence reprochée à Sunology) ;
vue Jour d'abord, courbes pour le jour, barres pour les périodes longues ; toucher le
graphe pour lire une valeur ; batterie signée côté maison (décharge +) ; SoC en série à
part ; paire de KPIs **autoconsommation** / **autoproduction** ; vocabulaire FR : surplus,
injection, soutirage, heures creuses, Tempo, Linky. Peu d'apps dessinent les trous.

**Idées reprises** : routine de contrôle « charge le jour, décharge la nuit » (guide
propriétaire Tesla) → notre verdict ; « pas de données ≠ pas de production » (SolarEdge) ;
mention « incomplet » discrète (SMA) ; éviter le pic d'après-trou (Home Assistant) ;
charge nocturne normale en heures creuses / Tempo (Sunology, Fronius).
L'assistant IA d'Enphase (août 2026) répond à « Is my system operating normally? » :
c'est la question que notre verdict traite sans IA.

## 3. Apps d'intervention terrain (FSM) et ergonomie

| App | Liste | Clôture | Hors ligne | À noter |
|---|---|---|---|---|
| ServiceTitan | jour | 3 taps, **bloquée** si obligatoires manquants | complet, synchro auto | résumé IA depuis l'audio |
| Jobber | « Today's appointments » | un bouton, checklist incomplète = **avertit mais laisse clôturer** | formulaires, notes, pièces jointes | 10 photos d'affilée sans quitter l'appareil |
| Housecall Pro | On My Way / Start / Finish horodatés | Finish | **lecture seule** | contre-exemple |
| Praxedo (FR) | planning + historique équipement | formulaires, photos horodatées, signature | file locale, synchro auto | IA de reformulation des notes |
| Fieldwire | tâches sur plans | statut + photos | oui | **preuve de synchro** (numéro attribué par le serveur) |
| SafetyCulture | inspections | réponse signalée → étape « action » | liste d'état de synchro | |
| Dynamics 365 FS | – | – | icône de synchro 6 états dans l'en-tête | |

**Ergonomie gants** : Apple 44 pt, Material 48 dp (~9 mm), NN/g 1 cm (2 cm en mobilité) ;
Hoober : précision 7 mm au centre, 12 mm aux coins, bas d'écran moins précis, 20 mm
éliminent presque toutes les erreurs en marchant ; Zebra « big buttons » gants +25 %,
texte +30 % ; 12 / 15 / 19 mm (nu / gants fins / épais) attribués à ISO/TS 9241-411
*(non vérifié)*. Haptique réservée aux succès / échecs importants (Apple HIG).
Dictée : 16–24 % d'erreurs en milieu industriel (blogs fournisseurs) ; dictée iOS hors
ligne seulement si le pack FR est téléchargé.

**Normes d'alarme** : ISA-101 — tons neutres pour le normal, couleur réservée à
l'anormal, ≥ 2 canaux (couleur, forme, texte), une donnée périmée doit être visiblement
anormale. ISA-18.2 / IEC 62682 — une alarme exige une réponse ; 3–4 priorités (~80/15/5 %) ;
> 10 alarmes en 10 min = inondation ; mise en sourdine limitée dans le temps.
WCAG 1.4.1 (pas de couleur seule), 1.4.11 (icônes ≥ 3:1). Ticketing : Résolu → Clos
automatique après 48–72 h, réouvrable.

## 4. Impact sur la spec

| Sujet | Avant | Après benchmark | Source |
|---|---|---|---|
| Seuil « Sans nouvelles » | 6 h | **12 h** + « depuis X h » | Enphase |
| Rendu « Sans nouvelles » | gris | gris + icône « ? » + contour pointillé | Sungrow / FoxESS / Hoymiles + ISA-101 |
| Rendu OK | teal sur menthe | **discret**, coche seule | ISA-101 |
| Statut | libellé | libellé + **ligne de raison** | Enphase |
| Alerte → manip | immédiate | **délai de grâce 30 min** + **anti-rafale** « Coupure probable » | VRM, ISA-18.2 |
| Alerte levée | manip fermée | fermée si jamais ouverte, sinon **« à confirmer »** | SMA, SolarEdge |
| « Résolu » | confirmation par la batterie | + **24 h max**, **réouverture** si l'alerte revient | ticketing ITSM |
| Verdict | surplus vs charge | + **heures creuses / Tempo**, météo | Sunology, Fronius |
| Trous | bande hachurée | + « en attente » vs « perdues », « incomplet », pas de pic | SolarEdge, SMA, Home Assistant |
| KPIs | absorbé / rendu, autonomie | **Chargé / Déchargé**, autoproduction + autoconsommation définies | Enphase FR, EDF, ekwateur |
| Graphe batterie | charge ↑ | inchangé mais **axe libellé ▲ Charge / ▼ Décharge** | Tesla / Enphase / HA (inverse) |
| Lecture des graphes | – | **tap = curseur vertical partagé** | Tesla, Enphase, SMA |
| Cibles tactiles | ≥ 56 px | 56 dp min, **96 dp** Résolu / Pas résolu, **72 dp** bouton bas, 12 dp d'écart | Hoober, Zebra, NN/g |
| Dictée | dictée | + **repli mémo audio** | fiabilité hors ligne iOS |
| Envoi | « en attente » | **en attente / envoi / envoyé / échec + réessayer**, photos à part | Dynamics, Fieldwire, Jobber |
| Pas résolu | 2ᵉ passage | + **suite** : je repasse / je transmets à Revolty | SafetyCulture |
| Test de communication | non bloquant en fin | **étape à part** avec « Passer, vérifier plus tard » | Enphase, Tesla, Hoymiles « Unfinished » |
| Email client | – | **facultatif mais proposé** | Tesla, Sungrow, FoxESS |

**Écartés (à justifier dans la page de notes)** : vue carte (20 systèmes, recherche
suffit) ; flux d'énergie animé (répandu mais ne sert pas le diagnostic) ; signature
client (logique de facturation) ; photos imposées à la mise en service (casseraient les
5 min, gardées en « plus tard ») ; firmware forcé et assistants qui s'allongent
(contre-exemples SolarEdge, Enphase).

## 5. Sources

Apps fabricants
- https://enphase.com/document/user-manuals/fleet-management-dashboard
- https://kizuna.ca/wp-content/uploads/2025/01/Enphase-IQ-Gateway-Commissioning-with-Installer-App.pdf
- https://support.enphase.com/s/article/fixing-the-gateway-not-reporting-system-error
- https://enphase.com/installers/apps
- https://apps.apple.com/us/app/enphase-installer-toolkit/id1452583697
- https://energylibrary.tesla.com/docs/Public/EnergyStorage/Powerwall/3/DeviceSetupGuide/en-us/
- https://apps.apple.com/us/app/tesla-one/id1625770308
- https://corporate.solaredge.com/en/news-and-media/local-announcements/solaredge-launches-new-mobile-app
- https://knowledge-center.solaredge.com/sites/kc/files/se-alerts-in-monitoring-application-note.pdf
- https://www.solaredge.com/sites/default/files/solaredge-setapp-faqs-eng.pdf
- https://doe-duurzaam.nl/wp-content/uploads/2025/06/FusionSolar-App-Quick-Guide.pdf
- https://support.huawei.com/enterprise/en/doc/EDOC1100165054/cf38aae6/monitoring-alarm-information
- https://www.victronenergy.com/media/pg/VRM_Portal_manual/en/managing-multiple-installations.html
- https://www.victronenergy.com/media/pg/VRM_Portal_manual/en/alarms-and-monitoring.html
- https://service.sungrowpower.com.au/files/Web_Files/FAQ/GD_202202_All_iSolarCloud%20APP%20Commissioning%20Guide_V1.2.pdf
- https://static.hoymiles.com/cfs/doc/S-miles%20Cloud%20User%20Guide%20V.06.pdf
- https://www.fox-ess.com/Public/Uploads/uploadfile/files/20260212/ENFoxCloud2.0AppUserManual.pdf
- https://kb.givenergy.cloud/print.php?id=70
- https://manuals.sma.de/SPortal/en-US/16935750923.html
- https://www.fronius.com/en/solar-energy/solar-solutions/apps-software/solar-start

Dataviz énergie
- https://enphase.com/learn/home-energy/explore-your-system/monitor-your-energy-usage
- https://www.stocktitan.net/news/ENPH/enphase-energy-launches-ai-assistant-in-the-enphase-app-bringing-jsrz7hn3uy2o.html
- https://solarhomeownerguide.com/blog/how-to-monitor-solar-panel-performance-using-the-tesla-app-and-powerwall-dashboard/
- https://ressupply.com/documents/solaredge/Monitoring_Portal_User_Guide.pdf
- https://www.victronenergy.com/media/pg/VRM_Portal_manual/en/dashboard.html
- https://manuals.sma.de/HM-20/en-US/1075109259.html
- https://www.home-assistant.io/dashboards/energy/
- https://drcoolzic.github.io/ha-statistics-doc/doc/part5_find_fix/
- https://aide.sunology.eu/fr/article/app-stream-lexperience-inedite-pour-piloter-son-energie-ve86re/
- https://www.mac4ever.com/ecotech/197343-test-sunology-storey-la-batterie-solaire-francaise-plug-play-tient-elle-vraiment-ses-promesses
- https://www.edf-solutions-solaires.com/lexique/taux-autoconsommation/
- https://ekwateur.fr/blog/autoconsommation/taux-autoconsommation-autoproduction-difference/
- https://www.datawrapper.de/blog/dualaxis

Apps terrain, ergonomie, normes
- https://help.servicetitan.com/docs/complete-a-job-in-fma
- https://help.getjobber.com/hc/en-us/articles/115009740048-Checklists
- https://productupdates.getjobber.com/134787-keep-working-in-jobber-even-without-internet
- https://help.housecallpro.com/en/articles/4747652-housecall-pro-mobile-faq
- https://www.praxedo.com/product-tour/work-order-reports/
- https://help.fieldwire.com/hc/en-us/articles/360017420132-How-to-use-Tasks-on-the-Fieldwire-Mobile-Apps-iOS-and-Android
- https://help.safetyculture.com/en-US/000009/
- https://learn.microsoft.com/en-us/dynamics365/release-plan/2023wave1/service/dynamics365-field-service/offline-sync-status-dynamics-365-field-service-mobile
- https://www.nngroup.com/articles/touch-target-size/
- https://www.uxmatters.com/mt/archives/2017/07/design-for-fingers-touch-and-people-part-3.php
- https://developer.apple.com/design/human-interface-guidelines/playing-haptics
- https://industrialmonitordirect.com/blogs/knowledgebase/isa-101-high-performance-hmi-design-principles-color-strategy
- https://www.yokogawa.com/us/library/resources/media-publications/implementing-alarm-management-per-the-ansi-isa-182-standard-control-engineering/
- https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html
- https://www.servicenow.com/community/platform-analytics-forum/resolved-vs-closed-reporting-question/m-p/1273121
