const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { genererExemple, SORTIE } = require('../scripts/generer-exemple-kpi');

test('l\'exemple Power BI correspond à la sortie réelle de WF3', () => {
  const versionne = JSON.parse(fs.readFileSync(SORTIE, 'utf8'));
  assert.deepEqual(
    versionne,
    genererExemple(),
    'powerbi/exemple-kpi.json est périmé : lancer « npm run exemple:kpi » puis commiter',
  );
});

test('l\'exemple donne les valeurs annoncées dans powerbi/README.md', () => {
  const { synthese } = genererExemple();
  assert.equal(synthese.taux_validation_pct, 75);
  assert.equal(synthese.incidents_regroupes, 54);
  assert.equal(synthese.rex_publies, 10);
  assert.equal(synthese.rex_a_relire, 3);
  assert.equal(synthese.mttr_p1_min, 97.1);
  assert.equal(synthese.delai_relecture_moyen_h, 12.5);
});
