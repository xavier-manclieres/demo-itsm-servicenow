# Connecteur Jira Service Management

Même démo que `servicenow/`, avec Jira Service Management (plan gratuit) comme outil ITSM.
Le moteur de détection, Airtable, Claude et Power BI sont communs ; seuls les nœuds qui lisent
et écrivent dans l'outil ITSM changent.

État : en cours. Les workflows arriveront dans `workflows/` (WF0, WF1, WF1b, WF2, WF2b).

## Correspondance avec ServiceNow

| ServiceNow | Jira Service Management |
| --- | --- |
| Incident | Type de ticket « [System] Incident » |
| Problème | Type de ticket « Problem » (à créer dans le schéma du projet) |
| CI (`cmdb_ci`) | Composant du projet |
| Rattachement `problem_id` | Lien « Problem/Incident » (« causes » / « is caused by ») |
| Requête `sysparm_query` | Requête JQL |
| Business Rule P1 résolu | Règle d'automatisation Jira qui appelle le webhook n8n |

## Prérequis

- Site Jira Cloud gratuit, projet ITSM (3 agents maximum sur le plan gratuit).
- Type de ticket `Problem` ajouté au schéma de types du projet.
- Jeton d'API personnel, saisi dans l'identifiant n8n « Jira Software Cloud API » (jamais dans le dépôt).
