import { llmRespond } from '../core/llm.js';

const levelOrder = ['C-Level', 'Leadership', 'Manager/Lead', 'IC/Specialist'];

const fallbackBlueprint = {
  'C-Level': [
    'Chief Executive Officer',
    'Chief Operating Officer',
    'Chief Financial Officer',
    'Chief Technology Officer',
  ],
  Leadership: [
    'VP of Operations',
    'VP of Strategy',
    'Director of Risk & Compliance',
    'Head of Analytics',
  ],
  'Manager/Lead': [
    'Operations Manager',
    'Program Manager',
    'Engineering Manager',
    'Quality Manager',
  ],
  'IC/Specialist': [
    'Data Analyst',
    'Process Improvement Specialist',
    'Automation Engineer',
    'Customer Success Specialist',
  ],
};

function sanitizeId(raw) {
  return raw.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function normalizeLevel(level) {
  const source = String(level || '').toLowerCase();
  if (source.includes('c-level') || source.includes('c suite')) return 'C-Level';
  if (source.includes('vp') || source.includes('director') || source.includes('leadership')) return 'Leadership';
  if (source.includes('manager') || source.includes('lead')) return 'Manager/Lead';
  if (source.includes('ic') || source.includes('specialist') || source.includes('individual')) return 'IC/Specialist';
  return 'IC/Specialist';
}

function safeParseJsonArray(raw) {
  if (!raw || typeof raw !== 'string') return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) return null;
    try {
      const parsed = JSON.parse(match[0]);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
}

function buildFallbackRoles(industryName, count, levelFocus) {
  const pool = levelFocus === 'mixed'
    ? ['C-Level', 'C-Level', 'Leadership', 'Leadership', 'Manager/Lead', 'Manager/Lead', 'IC/Specialist', 'IC/Specialist']
    : Array.from({ length: count }, () => normalizeLevel(levelFocus));

  const levels = pool.concat(Array.from({ length: Math.max(0, count - pool.length) }, (_, idx) => levelOrder[idx % levelOrder.length])).slice(0, count);

  return levels.map((tier, idx) => {
    const templates = fallbackBlueprint[tier];
    const titleBase = templates[idx % templates.length];
    return {
      title: `${industryName} ${titleBase}`,
      level: tier,
      focus: `Drive ${industryName} performance through ${tier.toLowerCase()} execution discipline.`,
      kpi: 'resilience, adaptability, efficiency',
      horizon: tier === 'C-Level' ? '3Y' : tier === 'Leadership' ? '1Y' : 'Real-time',
      capability: tier === 'C-Level' ? 'Strategic governance' : tier === 'Leadership' ? 'Portfolio orchestration' : tier === 'Manager/Lead' ? 'Delivery coordination' : 'Operational specialization',
    };
  });
}

function normalizeGeneratedRole(role, industryName, index) {
  const title = role.title || `${industryName} Generated Role ${index + 1}`;
  const tier = normalizeLevel(role.level);
  const capabilityList = Array.isArray(role.capability)
    ? role.capability
    : String(role.capability || 'Execution quality').split(',').map((entry) => entry.trim()).filter(Boolean);

  return {
    id: `${sanitizeId(industryName)}_${sanitizeId(title)}_${index + 1}`,
    title,
    industry: industryName,
    tier,
    focus: role.focus || `Advance ${industryName} objectives with measurable outcomes.`,
    kpi: role.kpi || 'resilience, adaptability, efficiency',
    horizon: role.horizon || (tier === 'C-Level' ? '3Y' : tier === 'Leadership' ? '1Y' : 'Real-time'),
    capability: capabilityList.length ? capabilityList : ['Execution quality'],
    generated: true,
  };
}

export async function generateRolesForIndustry(industryName, count = 8, levelFocus = 'mixed') {
  const prompt = `Generate ${count} realistic job roles for the "${industryName}" industry.\nReturn strict JSON array only with fields: title, level, focus, kpi, horizon, capability.\nHierarchy levels allowed: C-Level, VP-Director, Manager-Lead, IC-Specialist.`;

  try {
    const response = await llmRespond(prompt, { mode: 'global', temperature: 0.6, maxTokens: 900, expectJson: true });
    const parsed = safeParseJsonArray(response);
    const source = parsed && parsed.length ? parsed : buildFallbackRoles(industryName, count, levelFocus);
    return source.slice(0, count).map((role, index) => normalizeGeneratedRole(role, industryName, index));
  } catch (error) {
    console.error('Role generation failed:', error);
    return buildFallbackRoles(industryName, count, levelFocus).map((role, index) => normalizeGeneratedRole(role, industryName, index));
  }
}
