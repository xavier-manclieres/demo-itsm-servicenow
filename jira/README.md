# Connecteur Jira Service Management

Même démo que `servicenow/`, avec Jira Service Management (plan gratuit) comme outil ITSM.
Le moteur de détection, Airtable, Claude et Power BI sont communs ; seuls les nœuds qui lisent
et écrivent dans l'outil ITSM changent.

Disponibles dans `workflows/`, tous testés sur le site Jira de la démo :

| Fichier | Rôle |
| --- | --- |
| `jira-wf0-jeu-de-donnees` | 3 composants (CI) et 22 incidents de démo |
| `jira-wf0b-incident-p1` | Un incident P1 commenté puis passé à « Terminé », pour tester WF2 |
| `jira-wf1-incidents-recurrents` | Regroupe les incidents récurrents, candidats dans Airtable (Outil = Jira) |
| `jira-wf1b-creation-probleme` | Crée le ticket Problem et le lie aux incidents après validation |
| `jira-wf2-brouillon-rex` | Brouillon de REX rédigé par Claude pour chaque P1 terminé |
| `jira-wf2b-publication-rex` | Publie le REX validé en commentaire interne du ticket |

Points propres à Jira :

- Les commentaires et descriptions sont au format ADF (Atlassian Document Format) : WF2 les convertit en texte avant de les envoyer à Claude, WF2b reconvertit le REX en paragraphes ADF.
- Le workflow JSM de la démo ne renseigne pas la date de résolution : WF2 se base sur la date de passage à « Terminé » (`statusCategoryChangedDate`) et exclut les incidents « Annulé ».
- Le REX publié est un commentaire interne (`sd.public.comment`), invisible du demandeur.

Les fichiers portent le nom de l'outil en préfixe (`jira-…`, `servicenow-…`) et, dans n8n, les workflows s'appellent « Démo ITSM Jira — … » ou « Démo ITSM ServiceNow — … », pour ne jamais confondre les deux.

## Correspondance avec ServiceNow

| ServiceNow | Jira Service Management |
| --- | --- |
| Incident | Type de ticket « [System] Incident » |
| Problème | Type de ticket « Problem » (à créer dans le schéma du projet) |
| CI (`cmdb_ci`) | Composant du projet |
| Rattachement `problem_id` | Lien « Problem/Incident » (« causes » / « is caused by ») |
| Requête `sysparm_query` | Requête JQL |
| Business Rule P1 résolu | Sondage toutes les 15 minutes (une règle d'automatisation Jira qui appelle un webhook n8n est possible) |
| Note de travail (`work_notes`) | Commentaire interne |

## Prérequis

- Site Jira Cloud gratuit, projet ITSM (3 agents maximum sur le plan gratuit).
- Type de ticket `Problem` ajouté au schéma de types du projet.
- Jeton d'API personnel, saisi dans l'identifiant n8n « Jira Software Cloud API » (jamais dans le dépôt).
