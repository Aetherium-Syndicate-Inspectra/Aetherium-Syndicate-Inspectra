import { callLLM } from '../services/llmProxy.js';

function buildDefaultFingerprint() {
  return {
    speed: 0.6,
    depth: 'summary',
    format: 'numbers',
    contextMode: 'strategic',
  };
}

function fallbackText(role, userMessage, fingerprint) {
  const style = `${fingerprint.depth}/${fingerprint.format}/${fingerprint.contextMode}`;
  if (fingerprint.format === 'story') {
    return `มุมมอง ${role.title}: จากโจทย์ "${userMessage}" เราควรเริ่มจากผลกระทบหลักและกำหนด action 3 ระยะ (ทันที/สัปดาห์/ไตรมาส) โดยรักษา KPI = ${role.kpi}. [mode:${style}]`;
  }
  return `มุมมอง ${role.title}\n1) Prioritize: ${role.focus}\n2) KPI guardrail: ${role.kpi}\n3) Horizon: ${role.horizon}\n4) Next action: define owner + SLA วันนี้ [mode:${style}]`;
}

function fallbackJsonForPrompt(prompt) {
  if (prompt.toLowerCase().includes('generate') && prompt.toLowerCase().includes('job roles')) {
    return JSON.stringify([], null, 2);
  }
  if (prompt.toLowerCase().includes('cross-company') || prompt.toLowerCase().includes('tournament')) {
    return JSON.stringify({ scenario: 'fallback', agents_responses: [], ranking: [], best_transferable_policy: '' }, null, 2);
  }
  return JSON.stringify({ reply: 'No backend response' });
}

export async function llmRespond(input, options = {}) {
  if (typeof input === 'string') {
    const pseudoRole = { id: 'global_orchestrator', industry: 'Cross-Industry' };
    const fingerprint = buildDefaultFingerprint();
    const backendReply = await callLLM(pseudoRole, input, fingerprint);
    if (backendReply) return backendReply;
    return options.expectJson ? fallbackJsonForPrompt(input) : '[LLM backend unavailable]';
  }

  const payload = input || {};
  const role = payload.role || { id: 'assistant', title: 'AI Assistant', industry: 'Cross-Industry', focus: 'General support', kpi: 'response quality', horizon: '1Y' };
  const userMessage = payload.userMessage || '';
  const fingerprint = payload.fingerprint || buildDefaultFingerprint();

  const backendReply = await callLLM(role, userMessage, fingerprint);
  if (backendReply) return backendReply;
  return fallbackText(role, userMessage, fingerprint);
}
