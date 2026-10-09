// Nœud « Calculer les indicateurs » de WF3, exécuté depuis l'export du workflow.
const path = require('node:path');
const { chargerCode, executer } = require('./n8n-code-runner');

const WF3 = path.join(__dirname, '..', 'workflows', 'wf3-indicateurs.json');
const code = chargerCode(WF3, 'Calculer les indicateurs');

// candidats : sortie de « Lire les candidats » (table Candidats problèmes)
// rex : sortie de « Lire les REX » (table Brouillons REX)
// Format Airtable aplati par n8n : { id, createdTime, ...champs }
function calculerIndicateurs(candidats = [], rex = []) {
  const [reponse] = executer(code, {
    noeuds: { 'Lire les candidats': candidats, 'Lire les REX': rex },
  });
  return reponse;
}

module.exports = { calculerIndicateurs };
