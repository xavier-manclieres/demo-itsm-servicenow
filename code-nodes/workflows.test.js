// Tests de bout en bout sur les exports : le jeu de données de WF0 doit
// produire exactement les trois candidats attendus par WF1.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { chargerCode, executer } = require('./n8n-code-runner');
const { regrouper } = require('./regroupement');

const WF0 = path.join(__dirname, '..', 'workflows', 'wf0-jeu-de-donnees.json');
const genere = () => executer(chargerCode(WF0, 'Générer 22 incidents'));

test('WF0 génère 22 incidents, dont 4 sans CI', () => {
  const incidents = genere();
  assert.equal(incidents.length, 22);
  assert.equal(incidents.filter((i) => !i.cmdb_ci).length, 4);
});

test('le jeu de données de WF0 donne trois candidats de 6 incidents dans WF1', () => {
  const incidents = genere().map((i, n) => ({ ...i, number: `INC${1000 + n}`, sys_id: `id${n}` }));
  const candidats = regrouper(incidents);
  assert.equal(candidats.length, 3);
  assert.deepEqual(candidats.map((c) => c.nb), [6, 6, 6]);
  assert.deepEqual(candidats.map((c) => c.categorie).sort(), ['hardware', 'network', 'software']);
});
