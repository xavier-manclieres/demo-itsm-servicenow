// Tests des deux nœuds Code de WF1b, exécutés depuis l'export du workflow.
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { chargerCode, executer } = require('./n8n-code-runner');

const WF1B = path.join(__dirname, '..', 'workflows', 'wf1b-creation-probleme.json');
const parIncident = chargerCode(WF1B, 'Un élément par incident');
const parCandidat = chargerCode(WF1B, 'Un élément par candidat');

const candidat = (id, ids) => ({ id, fields: { 'IDs incidents': ids, Statut: 'Validé' } });
const probleme = (n) => ({ sys_id: `prbSys${n}`, number: `PRB00${n}` });

test('un élément par incident, rattaché au bon problème', () => {
  const r = executer(parIncident, {
    input: [probleme(1), probleme(2)],
    noeuds: { 'Candidat validé': [candidat('recA', 'i1,i2,i3'), candidat('recB', 'i4,i5')] },
  });
  assert.equal(r.length, 5);
  assert.deepEqual(r.filter((x) => x.problemId === 'prbSys1').map((x) => x.incidentId), ['i1', 'i2', 'i3']);
  assert.deepEqual(r.filter((x) => x.problemId === 'prbSys2').map((x) => x.recordId), ['recB', 'recB']);
});

test('nettoie les espaces et ignore les identifiants vides', () => {
  const r = executer(parIncident, {
    input: [probleme(1)],
    noeuds: { 'Candidat validé': [candidat('recA', ' i1 , ,i2,')] },
  });
  assert.deepEqual(r.map((x) => x.incidentId), ['i1', 'i2']);
});

test('un candidat sans incident ne produit rien', () => {
  const r = executer(parIncident, {
    input: [probleme(1)],
    noeuds: { 'Candidat validé': [candidat('recA', '')] },
  });
  assert.deepEqual(r, []);
});

test('un seul élément par candidat pour la mise à jour Airtable', () => {
  const incidents = [
    { recordId: 'recA', problemNumber: 'PRB001' },
    { recordId: 'recA', problemNumber: 'PRB001' },
    { recordId: 'recB', problemNumber: 'PRB002' },
  ];
  const r = executer(parCandidat, { noeuds: { 'Un élément par incident': incidents } });
  assert.deepEqual(r, [
    { recordId: 'recA', problemNumber: 'PRB001', nbRattaches: 2 },
    { recordId: 'recB', problemNumber: 'PRB002', nbRattaches: 1 },
  ]);
});
