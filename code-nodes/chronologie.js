// Logique du nœud Code de WF2 : assemble la chronologie du journal ServiceNow
// et calcule la durée de l'incident en minutes (dates brutes en UTC).

const enDate = (s) => new Date(s.replace(' ', 'T') + 'Z');

function dureeMinutes(ouvert, resolu) {
  return Math.round((enDate(resolu) - enDate(ouvert)) / 60000);
}

function construireChronologie(notes) {
  return notes
    .map((n) => `${n.sys_created_on} UTC, ${n.sys_created_by} : ${n.value}`)
    .join('\n');
}

function preparerRex(incident, notes) {
  return {
    ...incident,
    chronologie: construireChronologie(notes),
    duree: dureeMinutes(incident.opened_at, incident.resolved_at),
  };
}

module.exports = { dureeMinutes, construireChronologie, preparerRex };
