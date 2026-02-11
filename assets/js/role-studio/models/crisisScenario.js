export const crisisScenarios = [
  {
    id: 'global_supply_shock_2026',
    name: 'Global Supply Shock 2026',
    severity: 0.8,
    uncertainty: 0.6,
    industry_effects: {
      Aviation: 'Titanium and engine part bottleneck',
      Medical: 'Sterile packaging shortage',
      Marketing: 'Ad inventory volatility',
      Product: 'Component and vendor lead-time spike',
      AI: 'GPU allocation freeze',
      'Cross-Industry': 'Multi-region logistics halt',
      Film: 'Post-production pipeline delay',
    },
  },
];

function scoreDecision(seed) {
  return Math.max(0.5, Math.min(0.95, seed));
}

export function runTournament({ scenarioId, industries, roleData }) {
  const scenario = crisisScenarios.find((item) => item.id === scenarioId);
  if (!scenario) return { scenario: null, results: [], transferablePolicies: [] };

  const results = industries.map((industry, idx) => {
    const role = roleData.find((entry) => entry.industry === industry && entry.tier === 'C-Level');
    if (!role) return null;
    const resilience = scoreDecision(0.63 + idx * 0.05);
    const adaptability = scoreDecision(0.66 + (industry.length % 3) * 0.04);
    const efficiency = scoreDecision(0.68 - idx * 0.02);
    const trust = scoreDecision(0.64 + (idx % 2) * 0.05);
    const viability = scoreDecision(0.62 + (industry.includes('AI') ? 0.06 : 0.03));
    const universalScore = Number((resilience * 0.3 + adaptability * 0.25 + efficiency * 0.2 + trust * 0.15 + viability * 0.1).toFixed(4));
    return {
      industry,
      ceoId: role.id,
      decision: `Mitigate: ${scenario.industry_effects[industry]}. Prioritize supplier diversification + strategic buffer.`,
      kpi: { resilience, adaptability, efficiency, trust, viability },
      universalScore,
    };
  }).filter(Boolean).sort((a, b) => b.universalScore - a.universalScore);

  const transferablePolicies = [
    'build_strategic_buffer',
    'avoid_single_point_of_failure',
    'demand_forecasting_under_uncertainty',
  ];

  return { scenario, results, transferablePolicies };
}
