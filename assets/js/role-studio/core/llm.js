import { callLLM } from '../services/llmProxy.js';

export async function llmRespond({ role, userMessage, fingerprint }) {
  const backendReply = await callLLM(role, userMessage, fingerprint);
  if (backendReply) return backendReply;

  const style = `${fingerprint.depth}/${fingerprint.format}/${fingerprint.contextMode}`;
  if (fingerprint.format === 'story') {
    return `มุมมอง ${role.title}: จากโจทย์ "${userMessage}" เราควรเริ่มจากผลกระทบหลักและกำหนด action 3 ระยะ (ทันที/สัปดาห์/ไตรมาส) โดยรักษา KPI = ${role.kpi}. [mode:${style}]`;
  }
  return `มุมมอง ${role.title}\n1) Prioritize: ${role.focus}\n2) KPI guardrail: ${role.kpi}\n3) Horizon: ${role.horizon}\n4) Next action: define owner + SLA วันนี้ [mode:${style}]`;
}
