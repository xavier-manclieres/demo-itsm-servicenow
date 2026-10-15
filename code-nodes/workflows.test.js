// Tests de bout en bout sur les exports : le jeu de données de WF0 doit
// produire exactement les trois candidats attendus par WF1.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { chargerCode, executer } = require('./n8n-code-runner');
const { regrouper } = require('./regroupement');

const WF0 = path.join(__dirname, '..', 'servicenow', 'workflows', 'servicenow-wf0-jeu-de-donnees.json');
// CI que la CMDB renverrait (existants) ; « Créer le CI » n'a rien à ajouter ici.
const CMDB = [
  { name: 'ERP-PROD', sys_id: 'sysErp' },
  { name: 'NAS-FICHIERS', sys_id: 'sysNas' },
  { name: 'MAIL-EXCH-01', sys_id: 'sysMail' },
];
const genere = (existants = CMDB, crees = [{ aCreer: false }]) => executer(
  chargerCode(WF0, 'Générer 22 incidents'),
  { input: crees, noeuds: { 'Chercher les CI existants': existants } },
);

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

test('WF0 ServiceNow : les incidents pointent vers les sys_id des CI de la CMDB', () => {
  const incidents = genere();
  assert.deepEqual([...new Set(incidents.filter((i) => i.cmdb_ci).map((i) => i.cmdb_ci))].sort(), ['sysErp', 'sysMail', 'sysNas']);
});

test('WF0 ServiceNow : les CI qui viennent d\'être créés sont repris', () => {
  const incidents = genere([], CMDB);
  assert.equal(incidents.length, 22);
  assert.equal(incidents.filter((i) => i.cmdb_ci === 'sysErp').length, 6);
});

test('WF0 ServiceNow : un CI introuvable arrête le workflow', () => {
  assert.throws(() => genere(CMDB.slice(0, 2)), /MAIL-EXCH-01/);
});

test('WF0 ServiceNow : seuls les CI absents de la CMDB sont à créer', () => {
  const aCreer = executer(chargerCode(WF0, 'CI à créer'), {
    noeuds: {
      'Chercher les CI existants': [CMDB[0], {}],
      'Liste des CI': [{ name: 'ERP-PROD' }, { name: 'NAS-FICHIERS' }, { name: 'MAIL-EXCH-01' }],
    },
  });
  assert.deepEqual(aCreer.map((c) => c.name), ['NAS-FICHIERS', 'MAIL-EXCH-01']);
});

test('WF0 ServiceNow : rien à créer renvoie un élément pour poursuivre', () => {
  const r = executer(chargerCode(WF0, 'CI à créer'), {
    noeuds: {
      'Chercher les CI existants': CMDB,
      'Liste des CI': CMDB.map((c) => ({ name: c.name })),
    },
  });
  assert.deepEqual(r, [{ aCreer: false }]);
});

test('WF0 ServiceNow : le garde-fou s\'arrête si des incidents existent déjà', () => {
  const garde = chargerCode(WF0, 'Garde-fou');
  assert.deepEqual(executer(garde, { input: [{}] }), [{ ok: true }]);
  assert.throws(() => executer(garde, { input: [{ number: 'INC0010001' }] }), /INC0010001/);
});
