// Tests de la publication du REX côté ServiceNow : mise en forme HTML de la note de travail.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chargerCode, executer } = require('./n8n-code-runner');

const WF2B = path.join(__dirname, '..', 'servicenow', 'workflows', 'servicenow-wf2b-publication-rex.json');
const wf = JSON.parse(fs.readFileSync(WF2B, 'utf8'));
const noeud = (nom) => wf.nodes.find((n) => n.name === nom);

// Brouillon au format produit par Claude (structure réelle d'un REX).
const BROUILLON = [
  '# REX – Incident INC0010023 : ERP-PROD indisponible',
  '',
  '**Statut : brouillon à valider**',
  '',
  '## 1. Résumé',
  'Le pool était **saturé** (500/500), voir `pool-erp`.',
  'Cause probable : batch de clôture <script>.',
  '',
  '## 3. Chronologie horodatée',
  '| Heure | Événement |',
  '|---|---|',
  '| 09:02 | Alerte supervision |',
  '| 09:50 | Incident résolu. |',
  '',
  '## 6. Actions préventives proposées',
  '- Planifier le batch de clôture la nuit.',
  '- Alerter à 80 % du pool.',
  '1. Première étape',
  '',
  '*Note : incident fictif.*',
].join('\n');

const metEnForme = (brouillon = BROUILLON) => executer(chargerCode(WF2B, 'Mettre en forme le REX'), {
  input: [{ id: 'recB', createdTime: '2026-10-16T00:00:00.000Z', fields: { Incident: 'INC0010023', sys_id: 'abc123', Brouillon: brouillon, Statut: 'Validé', Outil: 'ServiceNow' } }],
})[0];

test('WF2b ServiceNow : la note de travail est du HTML encadré par [code]', () => {
  const r = metEnForme();
  assert.equal(r.sysId, 'abc123');
  assert.equal(r.recordId, 'recB');
  assert.match(r.noteDeTravail, /^\[code\]<p><em>REX validé \(relu par un humain avant publication\)<\/em><\/p>/);
  assert.match(r.noteDeTravail, /\[\/code\]$/);
});

test('WF2b ServiceNow : titres, gras, code, listes et tableau convertis', () => {
  const html = metEnForme().noteDeTravail;
  assert.match(html, /<h2>REX – Incident INC0010023 : ERP-PROD indisponible<\/h2>/);
  assert.match(html, /<h3>1\. Résumé<\/h3>/);
  assert.match(html, /<strong>saturé<\/strong>/);
  assert.match(html, /<code>pool-erp<\/code>/);
  assert.match(html, /<br>Cause probable/);
  assert.match(html, /<th [^>]*>Heure<\/th><th [^>]*>Événement<\/th>/);
  assert.match(html, /<td [^>]*>09:50<\/td><td [^>]*>Incident résolu\.<\/td>/);
  assert.match(html, /<ul><li>Planifier le batch de clôture la nuit\.<\/li><li>Alerter à 80 % du pool\.<\/li><\/ul>/);
  assert.match(html, /<ol><li>Première étape<\/li><\/ol>/);
  assert.match(html, /<em>Note : incident fictif\.<\/em>/);
});

test('WF2b ServiceNow : mention « brouillon » retirée, Markdown et HTML du texte neutralisés', () => {
  const html = metEnForme().noteDeTravail;
  assert.doesNotMatch(html, /brouillon à valider/);
  assert.doesNotMatch(html, /\*\*|\|---|<script>/);
  assert.match(html, /&lt;script&gt;/);
});

test('WF2b ServiceNow : la note envoyée est celle mise en forme', () => {
  const p = noeud("Ajouter le REX à l'incident").parameters;
  assert.equal(p.id, '={{ $json.sysId }}');
  assert.equal(p.fieldsToSend.field[0].column, 'work_notes');
  assert.equal(p.fieldsToSend.field[0].value, '={{ $json.noteDeTravail }}');
  assert.deepEqual(wf.connections['REX validé'].main[0].map((c) => c.node), ['Mettre en forme le REX']);
  assert.equal(noeud('Passer le REX à Publié').parameters.columns.value.id, "={{ $('Mettre en forme le REX').item.json.recordId }}");
});
