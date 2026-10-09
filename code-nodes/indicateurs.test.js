const test = require('node:test');
const assert = require('node:assert/strict');
const { calculerIndicateurs } = require('./indicateurs');

const candidat = (n, statut, nb, extra = {}) => ({
  id: `rec${n}`, createdTime: '2026-10-01T02:00:00.000Z',
  Signature: `CI-${n}|Logiciel`, CI: `CI-${n}`, 'Nb incidents': nb, Statut: statut, ...extra,
});
const rex = (n, statut, duree, cree, modifie, extra = {}) => ({
  id: `recR${n}`, createdTime: cree, Incident: `INC${n}`, Titre: 'ERP indisponible',
  'Durée (min)': duree, Statut: statut, 'Modifié le': modifie, ...extra,
});

test('un problème créé compte parmi les validés', () => {
  const { synthese } = calculerIndicateurs([
    candidat(1, 'Créé', 6), candidat(2, 'Validé', 5), candidat(3, 'Rejeté', 4), candidat(4, 'À trier', 3),
  ]);
  assert.equal(synthese.problemes_proposes, 4);
  assert.equal(synthese.problemes_valides, 2);
  assert.equal(synthese.problemes_rejetes, 1);
  assert.equal(synthese.problemes_crees, 1);
  assert.equal(synthese.problemes_a_trier, 1);
  assert.equal(synthese.taux_validation_pct, 67);
  assert.equal(synthese.incidents_regroupes, 18);
});

test('pas de taux de validation tant que rien n\'est décidé', () => {
  const { synthese } = calculerIndicateurs([candidat(1, 'À trier', 3)]);
  assert.equal(synthese.taux_validation_pct, null);
});

test('le délai de relecture ne porte que sur les REX publiés', () => {
  const { synthese } = calculerIndicateurs([], [
    rex(1, 'Publié', 90, '2026-10-05T10:00:00.000Z', '2026-10-05T14:00:00.000Z'),
    rex(2, 'Publié', 45, '2026-10-06T10:00:00.000Z', '2026-10-06T12:00:00.000Z'),
    rex(3, 'À relire', 30, '2026-10-09T10:00:00.000Z', '2026-10-09T20:00:00.000Z'),
  ]);
  assert.equal(synthese.rex_rediges, 3);
  assert.equal(synthese.rex_publies, 2);
  assert.equal(synthese.rex_a_relire, 1);
  assert.equal(synthese.delai_relecture_moyen_h, 3);
});

test('le MTTR des P1 ignore les durées manquantes', () => {
  const { synthese } = calculerIndicateurs([], [
    rex(1, 'À relire', 90, '2026-10-05T10:00:00.000Z', '2026-10-05T10:00:00.000Z'),
    rex(2, 'À relire', 45, '2026-10-06T10:00:00.000Z', '2026-10-06T10:00:00.000Z'),
    rex(3, 'À relire', undefined, '2026-10-07T10:00:00.000Z', '2026-10-07T10:00:00.000Z'),
  ]);
  assert.equal(synthese.mttr_p1_min, 67.5);
});

test('tables vides : des zéros et des valeurs nulles, pas d\'erreur', () => {
  // Avec « Always Output Data », un nœud Airtable sans résultat renvoie un élément vide.
  const r = calculerIndicateurs([{}], [{}]);
  assert.equal(r.synthese.problemes_proposes, 0);
  assert.equal(r.synthese.rex_rediges, 0);
  assert.equal(r.synthese.mttr_p1_min, null);
  assert.equal(r.synthese.delai_relecture_moyen_h, null);
  assert.deepEqual(r.problemes, []);
  assert.deepEqual(r.rex, []);
});

test('les problèmes sont triés du plus récurrent au moins récurrent', () => {
  const { problemes } = calculerIndicateurs([candidat(1, 'À trier', 3), candidat(2, 'À trier', 7), candidat(3, 'À trier', 5)]);
  assert.deepEqual(problemes.map((p) => p.nb_incidents), [7, 5, 3]);
});

test('aucun texte de REX, hypothèse ni sys_id ne sort vers Power BI', () => {
  const r = calculerIndicateurs(
    [candidat(1, 'Validé', 4, { 'Hypothèse': 'HYPOTHESE-SECRETE', 'IDs incidents': 'SYSID-SECRET' })],
    [rex(1, 'Publié', 60, '2026-10-05T10:00:00.000Z', '2026-10-05T11:00:00.000Z', { Brouillon: 'TEXTE-DU-REX', sys_id: 'SYSID-REX' })],
  );
  const sortie = JSON.stringify(r);
  for (const fuite of ['HYPOTHESE-SECRETE', 'SYSID-SECRET', 'TEXTE-DU-REX', 'SYSID-REX']) {
    assert.ok(!sortie.includes(fuite), `fuite : ${fuite}`);
  }
});
