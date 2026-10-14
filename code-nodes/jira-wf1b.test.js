// WF1b Jira : la clé du ticket Problem sert d'identifiant et de numéro.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { chargerCode, executer } = require('./n8n-code-runner');

const WF1B = path.join(__dirname, '..', 'jira', 'workflows', 'wf1b-creation-probleme.json');
const parIncident = chargerCode(WF1B, 'Un élément par incident');
const wf = JSON.parse(require('node:fs').readFileSync(WF1B, 'utf8'));
const noeud = (nom) => wf.nodes.find((n) => n.name === nom);

const candidat = (id, ids) => ({ id, fields: { 'IDs incidents': ids, Statut: 'Validé' } });

test('chaque incident est rattaché à la clé du problème créé', () => {
  const r = executer(parIncident, {
    input: [{ id: '10100', key: 'IT-83' }, { id: '10101', key: 'IT-84' }],
    noeuds: { 'Candidat validé': [candidat('recA', 'IT-61,IT-62'), candidat('recB', 'IT-65')] },
  });
  assert.deepEqual(r.map((x) => [x.incidentId, x.problemId, x.problemNumber, x.recordId]), [
    ['IT-61', 'IT-83', 'IT-83', 'recA'],
    ['IT-62', 'IT-83', 'IT-83', 'recA'],
    ['IT-65', 'IT-84', 'IT-84', 'recB'],
  ]);
});

test('le problème est créé avec le type Problem (id 10007) dans le projet IT', () => {
  const corps = noeud('Créer le problème').parameters.jsonBody;
  assert.match(corps, /issuetype: \{ id: "10007" \}/);
  assert.match(corps, /project: \{ key: "IT" \}/);
});

test('le lien utilise le type « Problem/Incident »', () => {
  const p = noeud("Rattacher l'incident").parameters;
  assert.match(p.url, /\/rest\/api\/3\/issueLink$/);
  assert.match(p.jsonBody, /name: "Problem\/Incident"/);
});

test('aucun nœud ServiceNow dans le workflow Jira', () => {
  assert.equal(wf.nodes.filter((n) => /serviceNow/i.test(n.type)).length, 0);
});
