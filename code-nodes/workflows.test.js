// Tests de bout en bout sur les exports : le jeu de données de WF0 doit
// produire exactement les trois candidats attendus par WF1.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
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

test('WF0 ServiceNow : le garde-fou ne regarde que les incidents de la démo', () => {
  const wf = JSON.parse(fs.readFileSync(WF0, 'utf8'));
  const cherche = wf.nodes.find((n) => n.name === 'Incidents déjà présents ?');
  assert.equal(cherche.parameters.options.sysparm_query, 'correlation_id=demo-itsm');
  const cree = wf.nodes.find((n) => n.name === "Créer l'incident");
  // Le nœud « incident » de n8n ne connaît pas correlation_id : on écrit dans la table.
  assert.equal(cree.parameters.resource, 'tableRecord');
  assert.equal(cree.parameters.tableName, 'incident');
  const champ = cree.parameters.fieldsToSend.field.find((f) => f.column === 'correlation_id');
  assert.equal(champ.value, 'demo-itsm');
});

test('WF0 ServiceNow : le garde-fou s\'arrête si des incidents existent déjà', () => {
  const garde = chargerCode(WF0, 'Garde-fou');
  assert.deepEqual(executer(garde, { input: [{}] }), [{ ok: true }]);
  assert.throws(() => executer(garde, { input: [{ number: 'INC0010001' }] }), /INC0010001/);
});

test('ServiceNow : tous les nœuds ServiceNow utilisent OAuth2', () => {
  const dossier = path.join(__dirname, '..', 'servicenow', 'workflows');
  for (const f of fs.readdirSync(dossier).filter((x) => x.endsWith('.json'))) {
    const wf = JSON.parse(fs.readFileSync(path.join(dossier, f), 'utf8'));
    for (const n of wf.nodes.filter((x) => x.type === 'n8n-nodes-base.serviceNow')) {
      assert.equal(n.parameters.authentication, 'oAuth2', `${f} / ${n.name}`);
    }
  }
});

// Jira et ServiceNow partagent la table « Candidats problèmes » : chaque outil
// ne lit, ne crée et ne traite que ses propres candidats (champ « Outil »).
for (const [outil, dossier, prefixe] of [['Jira', 'jira', 'jira'], ['ServiceNow', 'servicenow', 'servicenow']]) {
  const lire = (nom) => JSON.parse(fs.readFileSync(path.join(__dirname, '..', dossier, 'workflows', `${prefixe}-${nom}.json`), 'utf8'));
  test(`${outil} : WF1 ne lit et ne crée que des candidats ${outil}`, () => {
    const wf1 = lire('wf1-incidents-recurrents');
    const n = (nom) => wf1.nodes.find((x) => x.name === nom);
    assert.equal(n('Lire les candidats existants').parameters.filterByFormula, `{Outil}='${outil}'`);
    assert.equal(n('Créer le candidat').parameters.columns.value.Outil, outil);
  });
  test(`${outil} : WF1b ne traite que les candidats ${outil}`, () => {
    const wf1b = lire('wf1b-creation-probleme');
    const declencheur = wf1b.nodes.find((x) => x.type === 'n8n-nodes-base.airtableTrigger');
    assert.match(declencheur.parameters.additionalFields.formula, new RegExp(`\\{Outil\\}='${outil}'`));
    assert.match(declencheur.parameters.additionalFields.fields, /Modifié le/);
  });
}
