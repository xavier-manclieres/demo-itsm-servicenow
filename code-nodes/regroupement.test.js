const test = require('node:test');
const assert = require('node:assert/strict');
const { regrouper } = require('./regroupement');

const inc = (n, ci, cat, desc = 'x') => ({
  number: `INC${n}`,
  sys_id: `id${n}`,
  cmdb_ci: ci,
  category: cat,
  short_description: desc,
});
const trois = (ci, cat) => [inc(1, ci, cat), inc(2, ci, cat), inc(3, ci, cat)];

test('garde un groupe de 3 incidents ou plus', () => {
  const r = regrouper(trois('ERP', 'software'));
  assert.equal(r.length, 1);
  assert.equal(r[0].nb, 3);
  assert.equal(r[0].signature, 'ERP | software');
  assert.equal(r[0].incidents, 'INC1, INC2, INC3');
  assert.equal(r[0].ids, 'id1,id2,id3');
});

test('écarte les groupes de moins de 3 incidents', () => {
  const r = regrouper([inc(1, 'ERP', 'software'), inc(2, 'ERP', 'software')]);
  assert.deepEqual(r, []);
});

test('sépare les catégories différentes sur un même CI', () => {
  const r = regrouper([...trois('ERP', 'software'), inc(4, 'ERP', 'network')]);
  assert.equal(r.length, 1);
  assert.equal(r[0].categorie, 'software');
});

test('ignore les incidents sans CI', () => {
  assert.deepEqual(regrouper(trois('', 'inquiry')), []);
});

test('lit le nom du CI quand ServiceNow renvoie un objet', () => {
  const ci = { display_value: 'ERP Production', value: 'abc123' };
  const r = regrouper(trois(ci, 'software'));
  assert.equal(r[0].ci, 'ERP Production');
  assert.equal(r[0].signature, 'ERP Production | software');
});

test('un nouveau groupe n\'a pas d\'enregistrement Airtable', () => {
  const r = regrouper(trois('ERP', 'software'), [{ id: 'rec1', Signature: 'Autre | network', Statut: 'À trier' }]);
  assert.equal(r[0].recordId, '');
  assert.equal(r[0].statutExistant, '');
});

test('un groupe déjà connu garde son statut décidé', () => {
  const r = regrouper(trois('ERP', 'software'), [{ id: 'rec1', Signature: 'ERP | software', Statut: 'Rejeté' }]);
  assert.equal(r[0].recordId, 'rec1');
  assert.equal(r[0].statutExistant, 'Rejeté');
});

test('supporte une table Airtable vide (élément vide de alwaysOutputData)', () => {
  const r = regrouper(trois('ERP', 'software'), [{}]);
  assert.equal(r.length, 1);
  assert.equal(r[0].recordId, '');
});
