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

test('garde un groupe de 3 incidents ou plus', () => {
  const r = regrouper([
    inc(1, 'ERP', 'software'),
    inc(2, 'ERP', 'software'),
    inc(3, 'ERP', 'software'),
  ]);
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
  const r = regrouper([
    inc(1, 'ERP', 'software'),
    inc(2, 'ERP', 'software'),
    inc(3, 'ERP', 'software'),
    inc(4, 'ERP', 'network'),
  ]);
  assert.equal(r.length, 1);
  assert.equal(r[0].categorie, 'software');
});

test('ignore les incidents sans CI', () => {
  const r = regrouper([
    inc(1, '', 'inquiry'),
    inc(2, '', 'inquiry'),
    inc(3, '', 'inquiry'),
  ]);
  assert.deepEqual(r, []);
});

test('le seuil est configurable', () => {
  const r = regrouper([inc(1, 'ERP', 'software'), inc(2, 'ERP', 'software')], 2);
  assert.equal(r.length, 1);
});
