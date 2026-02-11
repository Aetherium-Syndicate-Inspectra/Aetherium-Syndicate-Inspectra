export function renderTournamentResult({ scenario, results, transferablePolicies }) {
  if (!scenario) return 'Scenario not found';
  const ranking = results.map((row, idx) => `${idx + 1}. ${row.industry} (${row.universalScore}) - ${row.decision}`).join('\n');
  const policies = transferablePolicies.map((item) => `- ${item}`).join('\n');
  return [
    `Scenario: ${scenario.name}`,
    `Severity: ${scenario.severity} | Uncertainty: ${scenario.uncertainty}`,
    '',
    'Ranking:',
    ranking,
    '',
    'Transferable Policies:',
    policies,
  ].join('\n');
}
