"""Génère le jeu de données de démo (22 incidents fictifs) au format JSON.

Usage :
    python servicenow/generate_dataset.py SYS_ID_CI_1 SYS_ID_CI_2 SYS_ID_CI_3 > dataset.json

Les trois arguments sont les sys_id de trois CI existants dans l'instance ServiceNow.
"""
import json
import sys

FAMILLES = [
    ("software", ["Lenteurs ERP en fin de mois",
                  "ERP très lent sur la saisie des commandes",
                  "Temps de réponse ERP dégradé"]),
    ("hardware", ["Partage réseau inaccessible",
                  "Accès refusé au partage réseau",
                  "Partage réseau déconnecté"]),
    ("network", ["Mails bloqués en file d'attente",
                 "Mails non distribués",
                 "Retards de distribution des mails"]),
]
BRUIT = ["Imprimante en panne au 2e étage", "Mot de passe expiré",
         "Écran noir au démarrage", "Licence Office à renouveler"]


def generer(ci_ids, par_famille=6):
    incidents = []
    for ci, (categorie, textes) in zip(ci_ids, FAMILLES):
        for i in range(par_famille):
            incidents.append({
                "short_description": textes[i % len(textes)],
                "category": categorie,
                "cmdb_ci": ci,
            })
    for texte in BRUIT:
        incidents.append({"short_description": texte, "category": "inquiry"})
    return incidents


if __name__ == "__main__":
    if len(sys.argv) != 4:
        sys.exit("Usage : generate_dataset.py CI1 CI2 CI3")
    print(json.dumps(generer(sys.argv[1:4]), ensure_ascii=False, indent=2))
