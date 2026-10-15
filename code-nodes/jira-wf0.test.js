// WF0 Jira : même jeu de données que ServiceNow, avec les CI en composants Jira.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { chargerCode, executer } = require('./n8n-code-runner');

const WF0 = path.join(__dirname, '..', 'jira', 'workflows', 'jira-wf0-jeu-de-donnees.json');
const genere = () => executer(chargerCode(WF0, 'Générer 22 incidents'));

test('WF0 Jira : 3 CI créés comme composants', () => {
  const cis = executer(chargerCode(WF0, 'Liste des CI')).map((c) => c.name);
  assert.deepEqual(cis, ['ERP-PROD', 'NAS-FICHIERS', 'MAIL-EXCH-01']);
});

test('WF0 Jira : 22 incidents, 3 familles de 6 sur un CI connu, 4 sans CI', () => {
  const incidents = genere();
  assert.equal(incidents.length, 22);
  assert.equal(incidents.filter((i) => !i.ci).length, 4);
  const cis = executer(chargerCode(WF0, 'Liste des CI')).map((c) => c.name);
  for (const ci of cis) assert.equal(incidents.filter((i) => i.ci === ci).length, 6);
});

test('WF0 Jira : le garde-fou laisse passer un projet sans incident', () => {
  const r = executer(chargerCode(WF0, 'Garde-fou'), { input: [{ issues: [], isLast: true }] });
  assert.deepEqual(r, [{ ok: true }]);
});

test('WF0 Jira : le garde-fou s’arrête si des incidents existent déjà', () => {
  assert.throws(
    () => executer(chargerCode(WF0, 'Garde-fou'), { input: [{ issues: [{ key: 'IT-61' }] }] }),
    /IT-61/,
  );
});
