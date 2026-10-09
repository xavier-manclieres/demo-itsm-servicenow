# demo-itsm-servicenow

[![CI](https://github.com/xavier-manclieres/demo-itsm-servicenow/actions/workflows/ci.yml/badge.svg)](https://github.com/xavier-manclieres/demo-itsm-servicenow/actions/workflows/ci.yml)

Détection d'incidents récurrents et rédaction de REX assistée, en **infrastructure et workflows as code**.

Chaque nuit, n8n repère dans ServiceNow les incidents qui se répètent et propose des problèmes à valider. Quand un incident critique (P1) est résolu, il rédige un brouillon de REX à relire. Airtable sert d'espace de validation, Claude de rédacteur, Power BI de restitution.

> Règle de conception : ServiceNow reste la source de vérité, et rien n'y est créé sans validation humaine.

## Architecture

```
ServiceNow  <-- API REST / webhook -->  n8n  <-->  Claude (tri, rédaction)
                                         |
                                         +--> Airtable (validation humaine)
                                         +--> GET /kpi --> Power BI
```

| Workflow | Rôle | Déclencheur | État |
|---|---|---|---|
| WF0 | Jeu de données de démo | manuel, une fois | construit, testé |
| WF1 | Détection des incidents récurrents | chaque nuit à 2 h | construit, testé |
| WF1b | Création du problème dans ServiceNow | candidat passé à « Validé » (vérifié toutes les 5 min) | construit, testé |
| WF2 | Brouillon de REX | incident P1 résolu | construit, testé |
| WF2b | Publication du REX | brouillon passé à « Validé » (vérifié toutes les 5 min) | construit, testé |
| WF3 | Indicateurs pour Power BI | actualisation du rapport (GET /webhook/kpi) | construit, testé |

« Testé » signifie testé sur données fictives, en attendant l'instance ServiceNow de développement.

## Ce que le DevOps apporte

- **Infra as code** : n8n et Postgres démarrent avec `docker compose up`.
- **Workflows as code** : exports JSON dans `workflows/`, sans identifiants, relus par diff.
- **Prompts versionnés** : `prompts/`, chaque changement est un commit.
- **Tests** : `code-nodes/` exécute le code des nœuds Code **directement depuis les exports** de `workflows/`. Le code testé est exactement celui qui tourne dans n8n, sans copie à maintenir.
- **CI** : validation du JSON, tests et recherche de secrets à chaque push.

## Démarrage

Prérequis : Docker, Node.js 22 ou plus, Git.

```bash
cp .env.example .env        # puis renseigner les valeurs
docker compose -f infra/docker-compose.yml --env-file .env up -d
```

n8n est ensuite disponible sur http://localhost:5678.

```bash
npm test                    # tests des nœuds Code
```

### Importer les workflows

Dans n8n : *Workflows › Import from File*, puis choisir un fichier de `workflows/`. Ensuite :

1. Créer les identifiants **ServiceNow** (Basic Auth), **Airtable** (jeton d'accès), **Anthropic** et, pour WF3, une **clé d'en-tête** (Header Auth, par exemple `X-API-Key`), puis les associer aux nœuds.
2. Remplacer l'identifiant de base Airtable (`app…`) et de table (`tbl…`) par ceux de votre base, construite selon `airtable/schema.md`.
3. Pour WF0, remplacer les trois `SYS_ID_CI_x` par des sys_id de CI de votre instance.

### Brancher Power BI

WF3 renvoie un JSON en trois parties : `synthese` (une ligne d'indicateurs), `problemes` et `rex` (une ligne par enregistrement).

1. Activer WF3 dans n8n.
2. Dans Power BI Desktop : *Obtenir des données › Web › Avancé*, adresse `https://<votre-n8n>/webhook/kpi`, et ajouter l'en-tête de requête `X-API-Key` avec la clé.
3. Dans Power Query, développer `synthese` en table d'une ligne, et `problemes` et `rex` en tables de détail.

| Indicateur | Calcul |
|---|---|
| Taux de validation | validés (y compris créés) / (validés + rejetés) |
| Incidents regroupés | somme des incidents de tous les candidats |
| Délai de relecture | de la création du brouillon à sa publication, en heures |
| MTTR P1 | moyenne des durées ouverture → résolution des P1, en minutes |

## Arborescence

```
workflows/     exports JSON n8n (sans identifiants)
code-nodes/    JavaScript des nœuds Code + tests
prompts/       prompts du tri et du REX
servicenow/    Business Rule, jeu de données
airtable/      schéma des tables
infra/         docker-compose, déploiement
.github/       CI
```

## Sécurité

- Aucun secret dans le dépôt : `.env` est ignoré, seul `.env.example` est versionné.
- Les exports de workflows ne doivent contenir aucun identifiant (vérifier avant chaque commit).
- Avant tout envoi à Claude, WF2 masque les adresses IP et les secrets passés en clair, et remplace les noms des intervenants par « Intervenant 1, 2… ». Un test vérifie qu'aucune de ces données ne fuit.
- WF3 n'expose que des comptes, des durées et des statuts : ni texte de REX, ni hypothèse, ni sys_id. Son adresse est protégée par une clé d'en-tête, et un test vérifie l'absence de fuite.
- Toutes les données de démo sont fictives.

## Feuille de route

- [x] Semaines 1-2 : dépôt, CI, base Airtable, WF0 (instance ServiceNow demandée, en liste d'attente)
- [x] Semaines 3-4 : WF1 et WF1b, tests sur le code réel des nœuds
- [ ] Semaines 5-6 : WF2, WF2b et WF3 (faits), webhook ServiceNow
- [ ] Semaines 7-8 : déploiement Ansible, rapport Power BI, post LinkedIn

## Licence

MIT
