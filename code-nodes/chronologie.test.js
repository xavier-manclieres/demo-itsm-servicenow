const test = require('node:test');
const assert = require('node:assert/strict');
const { preparerRex } = require('./chronologie');

const p1 = (n, ouvert, resolu, extra = {}) => ({
  sys_id: `s${n}`, number: `INC${n}`, short_description: 'ERP indisponible',
  opened_at: ouvert, resolved_at: resolu, close_notes: 'Pool relancé', ...extra,
});
const note = (n, quand, qui, texte) => ({ element_id: `s${n}`, sys_created_on: quand, sys_created_by: qui, value: texte });

test('calcule la durée en minutes', () => {
  const [r] = preparerRex([p1(1, '2026-10-01 08:00:00', '2026-10-01 09:30:00')]);
  assert.equal(r.duree, 90);
});

test('la durée traverse minuit', () => {
  const [r] = preparerRex([p1(1, '2026-10-01 23:50:00', '2026-10-02 00:10:00')]);
  assert.equal(r.duree, 20);
});

test('remet la chronologie dans l\'ordre et l\'attribue au bon incident', () => {
  const [r] = preparerRex(
    [p1(1, '2026-10-01 08:00:00', '2026-10-01 09:00:00'), p1(2, '2026-10-01 08:00:00', '2026-10-01 09:00:00')],
    [note(1, '2026-10-01 08:40:00', 'bob', 'Redémarrage'), note(1, '2026-10-01 08:05:00', 'ana', 'Début analyse'), note(2, '2026-10-01 08:10:00', 'ana', 'Autre incident')],
  );
  assert.equal(r.nbNotes, 2);
  assert.match(r.chronologie, /^2026-10-01 08:05:00 UTC, Intervenant 1 : Début analyse\n2026-10-01 08:40:00 UTC, Intervenant 2 : Redémarrage$/);
});

test('aucun nom d\'intervenant n\'est transmis au modèle', () => {
  const [r] = preparerRex(
    [p1(1, '2026-10-01 08:00:00', '2026-10-01 09:00:00')],
    [note(1, '2026-10-01 08:05:00', 'jdupont', 'a'), note(1, '2026-10-01 08:10:00', 'amartin', 'b'), note(1, '2026-10-01 08:20:00', 'jdupont', 'c')],
  );
  assert.doesNotMatch(r.chronologie, /jdupont|amartin/);
  assert.match(r.chronologie, /08:20:00 UTC, Intervenant 1 : c/);
});

test('masque les adresses IP et les secrets', () => {
  const [r] = preparerRex(
    [p1(1, '2026-10-01 08:00:00', '2026-10-01 09:00:00', { close_notes: 'Serveur 10.20.30.40 relancé' })],
    [
      note(1, '2026-10-01 08:05:00', 'a', 'connexion mysql -pS3cret sur 192.168.1.10'),
      note(1, '2026-10-01 08:06:00', 'a', './check.sh --password=Secr3t! puis token: abc123'),
      note(1, '2026-10-01 08:07:00', 'a', 'mot de passe = azerty'),
    ],
  );
  for (const secret of ['S3cret', 'Secr3t', 'abc123', 'azerty', '192.168.1.10', '10.20.30.40']) {
    assert.ok(!(r.chronologie + r.close_notes).includes(secret), `fuite : ${secret}`);
  }
  assert.match(r.chronologie, /\[IP\]/);
  assert.match(r.close_notes, /\[IP\]/);
});

test('ne rédige pas deux fois le REX d\'un même incident', () => {
  const r = preparerRex(
    [p1(1, '2026-10-01 08:00:00', '2026-10-01 09:00:00'), p1(2, '2026-10-01 08:00:00', '2026-10-01 09:00:00')],
    [],
    [{ id: 'rec1', Incident: 'INC1' }],
  );
  assert.deepEqual(r.map((x) => x.number), ['INC2']);
});

test('un incident sans note produit quand même un brouillon', () => {
  const [r] = preparerRex([p1(1, '2026-10-01 08:00:00', '2026-10-01 09:00:00')], [{}], [{}]);
  assert.equal(r.chronologie, 'Aucune note de travail.');
  assert.equal(r.nbNotes, 0);
});
