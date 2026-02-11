export function freezeResonanceMoment({ role, userMessage, response, fingerprint, resonanceScore, intervention = null }) {
  const snapshot = {
    event_type: intervention ? 'resonance.drift.intervention' : 'resonance.interaction',
    timestamp: new Date().toISOString(),
    role_id: role.id,
    industry: role.industry,
    user_intent: userMessage,
    response_preview: response.slice(0, 140),
    fingerprint,
    resonance_score: resonanceScore,
    intervention,
  };
  const trail = JSON.parse(localStorage.getItem('freeze_trail') || '[]');
  trail.push(snapshot);
  localStorage.setItem('freeze_trail', JSON.stringify(trail.slice(-50)));
  return snapshot;
}
