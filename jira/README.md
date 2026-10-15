# Connecteur Jira Service Management

Même démo que `servicenow/`, avec Jira Service Management (plan gratuit) comme outil ITSM.
Le moteur de détection, Airtable, Claude et Power BI sont communs ; seuls les nœuds qui lisent
et écrivent dans l'outil ITSM changent.

État : en cours. Disponibles dans `workflows/` : `jira-wf0-jeu-de-donnees`, `jira-wf1-incidents-recurrents`, `jira-wf1b-creation-probleme`. À venir : WF2 et WF2b.

Les fichiers portent le nom de l'outil en préfixe (`jira-…`, `servicenow-…`) et, dans n8n, les workflows s'appellent « Démo ITSM Jira — … » ou « Démo ITSM ServiceNow — … », pour ne jamais confondre les deux.

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
