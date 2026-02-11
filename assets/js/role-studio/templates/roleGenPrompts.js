export const ROLE_PROMPT_TEMPLATES = {
  basic: ({ count, industry, level = 'mixed' }) => `Generate ${count} roles for ${industry} in ${level} hierarchy. Return strict JSON array with fields: title, level, focus, kpi, horizon, capability.`,
  advanced: ({ count, industry }) => `Generate ${count} roles with high resonance for ${industry}. Focus on KPI ARR growth, horizon 3Y, and capability AI orchestration. Return strict JSON array with fields: title, level, focus, kpi, horizon, capability.`,
  adaptive: ({ title, score, industry, driftHistory = '' }) => `Improve existing role "${title}" for higher resonance in ${industry}. Current resonance score=${score}. Drift history: ${driftHistory || 'none'}. Return strict JSON object with fields: title, level, focus, kpi, horizon, capability.`,
};

export function buildRolePrompt(templateName, payload) {
  const template = ROLE_PROMPT_TEMPLATES[templateName] || ROLE_PROMPT_TEMPLATES.basic;
  return template(payload);
}
