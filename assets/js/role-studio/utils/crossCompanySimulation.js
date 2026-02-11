import { llmRespond } from '../core/llm.js';
import { loadCompanyTemplate } from '../models/roleRegistry.js';

function scoreBySeed(seed) {
  return Number(Math.max(0.45, Math.min(0.95, seed)).toFixed(2));
}

function safeParseObject(raw) {
  if (!raw || typeof raw !== 'string') return null;
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function fallbackTournament(scenario, companyTypes) {
  const agentsResponses = companyTypes.map((companyType, index) => {
    const roles = loadCompanyTemplate(companyType);
    const representative = roles.find((role) => role.tier === 'C-Level') || roles[0];
    if (!representative) return null;
    const score = scoreBySeed(0.58 + index * 0.09);
    return {
      company: companyType,
      role: representative.title,
      proposal: `Execute joint command center for ${scenario} with weekly governance checkpoints and shared KPI telemetry.`,
      score,
    };
  }).filter(Boolean).sort((a, b) => b.score - a.score);

  return {
    scenario,
    agents_responses: agentsResponses,
    ranking: agentsResponses,
    best_transferable_policy: 'Establish cross-company incident command with shared data contracts and pre-approved escalation playbooks.',
  };
}

export async function runCrossCompanyTournament(scenario, companyTypes = ['tech-startup', 'traditional-corp']) {
  const agents = companyTypes.map((type) => {
    const roles = loadCompanyTemplate(type);
    const representative = roles.find((role) => role.tier === 'C-Level') || roles[0];
    return representative ? { companyType: type, title: representative.title } : null;
  }).filter(Boolean);

  const prompt = `Crisis Scenario: ${scenario}\nSimulate cross-company collaboration tournament.\nAgents:\n${agents.map((agent) => `- ${agent.companyType} ${agent.title}`).join('\n')}\nReturn strict JSON object with fields: scenario, agents_responses[], ranking[], best_transferable_policy.`;

  try {
    const raw = await llmRespond(prompt, { mode: 'global', temperature: 0.75, expectJson: true });
    const parsed = safeParseObject(raw);
    if (parsed && parsed.ranking) return parsed;
    return fallbackTournament(scenario, companyTypes);
  } catch (error) {
    console.error('Cross-company tournament failed:', error);
    return fallbackTournament(scenario, companyTypes);
  }
}

export function renderCrossCompanyResult(result) {
  if (!result) return 'No result';
  const ranking = (result.ranking || [])
    .map((row, index) => `${index + 1}. ${row.company} - ${row.role} (score=${row.score})\n   ${row.proposal}`)
    .join('\n');

  return [
    `Scenario: ${result.scenario}`,
    '',
    'Cross-company ranking:',
    ranking || '- no ranking data -',
    '',
    `Best transferable policy: ${result.best_transferable_policy || 'N/A'}`,
  ].join('\n');
}
