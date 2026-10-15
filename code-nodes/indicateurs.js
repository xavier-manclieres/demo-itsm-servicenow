// Nœud « Calculer les indicateurs » de WF3, exécuté depuis l'export du workflow.
const path = require('node:path');
const { chargerCode, executer } = require('./n8n-code-runner');

const WF3 = path.join(__dirname, '..', 'workflows', 'wf3-indicateurs.json');
const code = chargerCode(WF3, 'Calculer les indicateurs');

// candidats : sortie de « Lire les candidats » (table Candidats problèmes)
// rex : sortie de « Lire les REX » (table Brouillons REX)
// Format réel du nœud Airtable « Search » : { id, createdTime, fields: { ...champs } }.
// Les tests écrivent les enregistrements à plat ; on les remet au format réel ici.
const reel = ({ id, createdTime, ...fields }) => ({ id, createdTime, fields });
function calculerIndicateurs(candidats = [], rex = []) {
  const [reponse] = executer(code, {
    noeuds: { 'Lire les candidats': candidats.map(reel), 'Lire les REX': rex.map(reel) },
  });
  return reponse;
}

module.exports = { calculerIndicateurs };
