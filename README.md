# demo-itsm-servicenow

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

| Workflow | Rôle | Déclencheur |
|---|---|---|
| WF0 | Jeu de données de démo | manuel, une fois |
| WF1 | Détection des incidents récurrents | chaque nuit à 2 h |
| WF1b | Création du problème dans ServiceNow | candidat passé à « Validé » |
| WF2 | Brouillon de REX | incident P1 résolu |
| WF2b | Publication du REX | brouillon passé à « Validé » |
| WF3 | Indicateurs pour Power BI | actualisation du rapport |

## Ce que le DevOps apporte

- **Infra as code** : n8n et Postgres démarrent avec `docker compose up`.
- **Workflows as code** : exports JSON dans `workflows/`, sans identifiants, relus par diff.
- **Prompts versionnés** : `prompts/`, chaque changement est un commit.
- **Tests** : la logique des nœuds Code est isolée dans `code-nodes/` et testée.
- **CI** : validation du JSON, tests et recherche de secrets à chaque push.

## Démarrage

Prérequis : Docker, Node.js 20 ou plus, Git.

```bash
cp .env.example .env        # puis renseigner les valeurs
docker compose -f infra/docker-compose.yml --env-file .env up -d
```

n8n est ensuite disponible sur http://localhost:5678.

```bash
npm test                    # tests des nœuds Code
```

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
- Toutes les données de démo sont fictives.

## Feuille de route

- [ ] Semaines 1-2 : dépôt, n8n qui démarre, instance ServiceNow de développement, WF0
- [ ] Semaines 3-4 : WF1 et WF1b, tests, CI
- [ ] Semaines 5-6 : WF2, WF2b, WF3, webhook ServiceNow
- [ ] Semaines 7-8 : déploiement Ansible, rapport Power BI, post LinkedIn

## Licence

MIT
