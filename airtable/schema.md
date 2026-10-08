# Schéma de la base Airtable

Le champ « Modifié le » (type *Dernière modification*) est indispensable : c'est lui que surveille le déclencheur Airtable de n8n.

## Candidats problèmes

| Champ | Type | Rôle |
|---|---|---|
| Signature | Texte | Clé de mise à jour, CI + catégorie, évite les doublons d'une nuit à l'autre |
| CI | Texte | Élément de configuration commun |
| Nb incidents | Nombre | Sur les 30 derniers jours |
| Incidents | Texte long | Numéros INC concernés, pour lecture humaine |
| IDs incidents | Texte long | sys_id correspondants, pour le rattachement automatique |
| Titre proposé | Texte | Rédigé par Claude |
| Hypothèse | Texte long | Cause commune supposée, avec ce qui reste à vérifier |
| Statut | Sélection | À trier, Validé, Rejeté, Créé |
| Problème | Texte | Numéro PRB une fois créé dans ServiceNow |
| Modifié le | Dernière modification | Déclenche WF1b |

## Brouillons REX

| Champ | Type | Rôle |
|---|---|---|
| Incident | Texte | Numéro INC |
| sys_id | Texte | Pour réécrire dans l'incident |
| Titre | Texte | Description courte de l'incident |
| Durée (min) | Nombre | De l'ouverture à la résolution |
| Brouillon | Texte long | REX rédigé par Claude, à corriger directement |
| Statut | Sélection | À relire, Validé, Publié |
| Modifié le | Dernière modification | Déclenche WF2b |

## Actions (optionnel)

Responsable, échéance et lien vers le REX, pour le suivi des plans d'action et les relances automatiques.
