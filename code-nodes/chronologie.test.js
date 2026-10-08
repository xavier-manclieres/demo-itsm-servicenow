const test = require('node:test');
const assert = require('node:assert/strict');
const { dureeMinutes, construireChronologie, preparerRex } = require('./chronologie');

test('calcule la durée en minutes', () => {
  assert.equal(dureeMinutes('2026-10-01 08:00:00', '2026-10-01 09:30:00'), 90);
});

test('la durée traverse minuit', () => {
  assert.equal(dureeMinutes('2026-10-01 23:50:00', '2026-10-02 00:10:00'), 20);
});

test('construit une chronologie ordonnée comme fournie', () => {
  const txt = construireChronologie([
    { sys_created_on: '2026-10-01 08:05:00', sys_created_by: 'ana', value: 'Début analyse' },
    { sys_created_on: '2026-10-01 08:40:00', sys_created_by: 'bob', value: 'Redémarrage service' },
  ]);
  assert.equal(
    txt,
    '2026-10-01 08:05:00 UTC, ana : Début analyse\n2026-10-01 08:40:00 UTC, bob : Redémarrage service',
  );
});

test('preparerRex conserve les champs de l\'incident et ajoute durée et chronologie', () => {
  const r = preparerRex(
    { number: 'INC1', opened_at: '2026-10-01 08:00:00', resolved_at: '2026-10-01 08:45:00' },
    [{ sys_created_on: '2026-10-01 08:10:00', sys_created_by: 'ana', value: 'ok' }],
  );
  assert.equal(r.number, 'INC1');
  assert.equal(r.duree, 45);
  assert.match(r.chronologie, /ana : ok/);
});
