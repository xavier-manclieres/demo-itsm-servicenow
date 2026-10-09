// Nœud « Regrouper et comparer » de WF1, exécuté depuis l'export du workflow.
const path = require('node:path');
const { chargerCode, executer } = require('./n8n-code-runner');

const WF1 = path.join(__dirname, '..', 'workflows', 'wf1-incidents-recurrents.json');
const code = chargerCode(WF1, 'Regrouper et comparer');

// incidents : sortie de « Incidents des 30 derniers jours » (ServiceNow)
// existants : sortie de « Lire les candidats existants » (Airtable)
function regrouper(incidents, existants = []) {
  return executer(code, { input: incidents, noeuds: { 'Lire les candidats existants': existants } });
}

module.exports = { regrouper };
