// Nœud « Préparer les REX » de WF2, exécuté depuis l'export du workflow.
const path = require('node:path');
const { chargerCode, executer } = require('./n8n-code-runner');

const WF2 = path.join(__dirname, '..', 'workflows', 'wf2-brouillon-rex.json');
const code = chargerCode(WF2, 'Préparer les REX');

// incidents : sortie de « Incidents P1 résolus » (ServiceNow)
// notes : sortie de « Journal de l'incident » (sys_journal_field)
// rexExistants : sortie de « Lire les REX existants » (Airtable)
function preparerRex(incidents, notes = [], rexExistants = []) {
  return executer(code, {
    input: notes,
    noeuds: { 'Incidents P1 résolus': incidents, 'Lire les REX existants': rexExistants },
  });
}

module.exports = { preparerRex };
