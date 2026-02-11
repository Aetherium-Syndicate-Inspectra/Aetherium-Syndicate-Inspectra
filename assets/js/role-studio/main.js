import {
  roleData,
  industryTemplates,
  companyTypeTemplates,
  addGeneratedRoles,
  archiveRole,
  promoteRoleIndustryWeight,
} from './models/roleRegistry.js';
import { runTournament, crisisScenarios } from './models/crisisScenario.js';
import { state, getRoomKey } from './core/state.js';
import { buildResonanceFingerprint, DriftTracker, applyIntervention } from './core/resonance.js';
import { llmRespond } from './core/llm.js';
import { freezeResonanceMoment } from './services/freezeLight.js';
import { renderRoleNavigator, renderRoleCard } from './views/roleNavigator.js';
import { renderChatMessages, appendSystemMessage } from './views/chatWindow.js';
import { renderTournamentResult } from './views/impactBoard.js';
import { renderSkillsFirstOverlay } from './views/skillsOverlayView.js';
import {
  generateRolesForIndustry,
  validateGeneratedRoles,
  regenerateRoleForResonance,
} from './utils/roleGenerator.js';
import {
  runCrossCompanyTournament,
  renderCrossCompanyResult,
  exportTournamentPolicies,
} from './utils/crossCompanySimulation.js';
import { exportOrgChart } from './utils/exportOrgChart.js';

const workspacePresets = {
  all: () => true,
  executive: (role) => role.tier === 'C-Level' || role.tier === 'Leadership',
  ops: (role) => role.tier === 'Manager/Lead' || role.tier === 'IC/Specialist' || role.industry === 'Traditional Bank',
  engineering: (role) => role.industry === 'Tech SaaS' || /Engineer|Technology|AI/i.test(role.title),
};

const hubSoftwares = ['SAP S/4HANA', 'Salesforce CRM', 'Workday HCM', 'Oracle HCM Cloud', 'Dynamics 365'];

let activePreset = 'all';
let showSkillsView = false;
let pendingBatch = [];
let latestCrossTournament = null;
const resonanceByRole = Object.fromEntries(roleData.map((role) => [role.id, 0.88]));
const lowResonanceStreak = {};

const els = {
  roleGroups: document.getElementById('roleGroups'),
  roleCard: document.getElementById('roleCard'),
  roleCount: document.getElementById('roleCount'),
  chatRoleSelect: document.getElementById('chatRoleSelect'),
  modeGlobal: document.getElementById('modeGlobal'),
  modeRole: document.getElementById('modeRole'),
  chatWindow: document.getElementById('chatWindow'),
  chatInput: document.getElementById('chatInput'),
  sendBtn: document.getElementById('sendBtn'),
  speed: document.getElementById('responseSpeed'),
  depth: document.getElementById('detailDepth'),
  format: document.getElementById('responseFormat'),
  contextMode: document.getElementById('contextMode'),
  cLevelMode: document.getElementById('cLevelMode'),
  resonanceScore: document.getElementById('resonanceScore'),
  freezeCount: document.getElementById('freezeCount'),
  tournamentScenario: document.getElementById('tournamentScenario'),
  runTournament: document.getElementById('runTournament'),
  tournamentOutput: document.getElementById('tournamentOutput'),
  companyTypeSelect: document.getElementById('companyTypeSelect'),
  runCrossTournament: document.getElementById('runCrossTournament'),
  crossTournamentOutput: document.getElementById('crossTournamentOutput'),
  generatorIndustry: document.getElementById('generatorIndustry'),
  generatorCount: document.getElementById('generatorCount'),
  generateRoles: document.getElementById('generateRoles'),
  generateBatch: document.getElementById('generateBatch'),
  commitBatch: document.getElementById('commitBatch'),
  batchPreview: document.getElementById('batchPreview'),
  generatorStatus: document.getElementById('generatorStatus'),
  exportOrgPng: document.getElementById('exportOrgPng'),
  exportOrgSvg: document.getElementById('exportOrgSvg'),
  orgChartContainer: document.getElementById('orgChartContainer'),
  workspacePreset: document.getElementById('workspacePreset'),
  adaptiveHint: document.getElementById('adaptiveHint'),
  cardTabRole: document.getElementById('cardTabRole'),
  cardTabSkills: document.getElementById('cardTabSkills'),
  skillsOverlayPanel: document.getElementById('skillsOverlayPanel'),
  skillsOverlayContainer: document.getElementById('skillsOverlayContainer'),
  exportPolicies: document.getElementById('exportPolicies'),
  quickGenerateMissing: document.getElementById('quickGenerateMissing'),
  hubGrid: document.getElementById('hubGrid'),
  integrationA: document.getElementById('integrationA'),
  integrationB: document.getElementById('integrationB'),
  simulateIntegration: document.getElementById('simulateIntegration'),
  hubOutput: document.getElementById('hubOutput'),
  governanceChart: document.getElementById('governanceChart'),
};

function filteredRoles() {
  const matcher = workspacePresets[activePreset] || workspacePresets.all;
  return roleData.filter(matcher);
}

function selectedRole() {
  const filtered = filteredRoles();
  return filtered.find((r) => r.id === state.selectedRoleId) || filtered[0] || roleData[0];
}

function roleTemplateWeight(role) {
  const template = industryTemplates.find((item) => item.name === role.industry);
  return template?.weight || 1;
}

function renderOrgChart() {
  const grouped = filteredRoles().reduce((acc, role) => {
    if (!acc[role.industry]) acc[role.industry] = [];
    acc[role.industry].push(role);
    return acc;
  }, {});

  const tierWeight = { 'C-Level': 1, Leadership: 2, 'Manager/Lead': 3, 'IC/Specialist': 4 };
  const blocks = Object.entries(grouped).map(([industry, roles]) => {
    const sorted = roles.slice().sort((a, b) => (tierWeight[a.tier] || 99) - (tierWeight[b.tier] || 99));
    return `
      <div class="rounded-lg border border-slate-600 bg-slate-900/80 p-3">
        <div class="text-sm font-semibold mb-2">${industry}</div>
        <ul class="space-y-1 text-xs">
          ${sorted.map((role) => `<li class="flex justify-between gap-3"><span>${role.title}</span><span class="text-slate-400">${role.tier}</span></li>`).join('')}
        </ul>
      </div>
    `;
  }).join('');

  els.orgChartContainer.innerHTML = `<div class="grid md:grid-cols-2 xl:grid-cols-3 gap-3">${blocks || '<p class="text-xs text-slate-400">No roles in current preset.</p>'}</div>`;
}

function renderRoles() {
  const roles = filteredRoles();
  if (!roles.find((r) => r.id === state.selectedRoleId) && roles[0]) state.selectedRoleId = roles[0].id;
  const currentRole = selectedRole();

  els.roleGroups.innerHTML = renderRoleNavigator({
    roleData: roles,
    selectedRoleId: state.selectedRoleId,
    resonanceByRole,
    activePreset,
  });
  const industryCount = new Set(roles.map((r) => r.industry)).size;
  els.roleCount.textContent = `${roles.length} roles / ${industryCount} industries (${industryTemplates.length} templates)`;
  els.roleCard.innerHTML = renderRoleCard(currentRole, roleTemplateWeight(currentRole));
  renderOrgChart();

  document.querySelectorAll('.role-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.selectedRoleId = btn.dataset.roleId;
      renderAll();
    });
  });

  document.getElementById('promoteRoleBtn')?.addEventListener('click', () => {
    const updated = promoteRoleIndustryWeight(currentRole.id, 0.2);
    els.generatorStatus.textContent = updated
      ? `Promoted ${currentRole.title} → ${updated.name} weight=${updated.weight}`
      : 'Promote failed';
    renderAll();
  });

  document.getElementById('archiveRoleBtn')?.addEventListener('click', () => {
    const archived = archiveRole(currentRole.id);
    els.generatorStatus.textContent = archived ? `Archived role: ${archived.title}` : 'Archive failed';
    renderAll();
  });

  if (showSkillsView) {
    renderSkillsFirstOverlay('skillsOverlayContainer', currentRole);
  }
}

function renderSelects() {
  const roles = filteredRoles();
  const options = roles.map((r) => `<option value="${r.id}" ${r.id === state.selectedRoleId ? 'selected' : ''}>${r.title}</option>`).join('');
  els.chatRoleSelect.innerHTML = options;
  els.tournamentScenario.innerHTML = crisisScenarios.map((item) => `<option value="${item.id}">${item.name}</option>`).join('');

  if (!els.companyTypeSelect.innerHTML.trim()) {
    els.companyTypeSelect.innerHTML = Object.values(companyTypeTemplates)
      .map((item) => `<option value="${item.key}">${item.label}</option>`)
      .join('');
    [...els.companyTypeSelect.options].forEach((option, index) => {
      if (index < 2) option.selected = true;
    });
  }
}

function renderChat() {
  const room = getRoomKey(state.selectedRoleId, state.chatMode);
  if (!state.chats[room]) state.chats[room] = [];
  els.chatWindow.innerHTML = renderChatMessages(state.chats[room]);
  els.modeGlobal.className = `px-3 py-1 rounded ${state.chatMode === 'global' ? 'bg-amber-400 text-slate-900 font-semibold' : 'text-slate-300'}`;
  els.modeRole.className = `px-3 py-1 rounded ${state.chatMode === 'role' ? 'bg-amber-400 text-slate-900 font-semibold' : 'text-slate-300'}`;
  els.freezeCount.textContent = String(state.freezeTrail.length);
  els.resonanceScore.textContent = state.resonance.score.toFixed(2);
}

function readResonanceControls() {
  state.resonance.speed = Number(els.speed.value);
  state.resonance.depth = els.depth.value;
  state.resonance.format = els.format.value;
  state.resonance.contextMode = els.contextMode.value;
}

function adjustByCLevelMode() {
  if (els.cLevelMode.value === 'crisis') {
    state.cLevelMode = 'crisis';
    state.resonance.contextMode = 'operational';
    state.resonance.depth = 'summary';
  } else {
    state.cLevelMode = 'visionary';
    state.resonance.contextMode = 'strategic';
    state.resonance.depth = 'deep';
  }
  els.contextMode.value = state.resonance.contextMode;
  els.depth.value = state.resonance.depth;
}

async function checkAdaptiveRegeneration(role, score) {
  if (state.cLevelMode !== 'crisis') return;
  const streak = score < 0.7 ? (lowResonanceStreak[role.id] || 0) + 1 : 0;
  lowResonanceStreak[role.id] = streak;
  if (streak < 2) return;

  const driftHistory = `score history below threshold for ${streak} interactions`;
  els.adaptiveHint.textContent = `Adaptive suggest: regenerating ${role.title} (score=${score.toFixed(2)})...`;
  const regenerated = await regenerateRoleForResonance({ role, score, industry: role.industry, driftHistory });
  if (!regenerated) return;

  role.focus = regenerated.focus;
  role.kpi = regenerated.kpi;
  role.horizon = regenerated.horizon;
  role.capability = regenerated.capability;
  lowResonanceStreak[role.id] = 0;
  freezeResonanceMoment({
    role,
    userMessage: '[adaptive regenerate]',
    response: `Regenerated role for low resonance in crisis mode`,
    fingerprint: buildResonanceFingerprint(state.resonance),
    resonanceScore: score,
    intervention: { adaptive_regeneration: true },
  });
  state.freezeTrail = JSON.parse(localStorage.getItem('freeze_trail') || '[]');
  els.adaptiveHint.textContent = `Adaptive regenerated ${role.title} after low-resonance streak.`;
  renderAll();
}

const driftTracker = new DriftTracker({
  threshold: 0.15,
  onDrift: (drift) => {
    state.resonance = applyIntervention(state.resonance);
    els.depth.value = state.resonance.depth;
    els.format.value = state.resonance.format;
    els.contextMode.value = state.resonance.contextMode;
    const room = getRoomKey(state.selectedRoleId, state.chatMode);
    appendSystemMessage(state.chats[room], `Auto-switch triggered (drift=${drift.toFixed(2)}): summary↔deep, numbers↔story.`);
    freezeResonanceMoment({
      role: selectedRole(),
      userMessage: '[system drift intervention]',
      response: 'Auto-switch response strategy applied',
      fingerprint: buildResonanceFingerprint(state.resonance),
      resonanceScore: state.resonance.score,
      intervention: { drift_ratio: Number(drift.toFixed(4)) },
    });
    state.freezeTrail = JSON.parse(localStorage.getItem('freeze_trail') || '[]');
    renderChat();
  },
});

async function onSend() {
  const userMessage = els.chatInput.value.trim();
  if (!userMessage) return;
  readResonanceControls();
  const room = getRoomKey(state.selectedRoleId, state.chatMode);
  if (!state.chats[room]) state.chats[room] = [];

  const role = selectedRole();
  const fingerprint = buildResonanceFingerprint(state.resonance);
  const response = await llmRespond({ role, userMessage, fingerprint });

  state.chats[room].push({ role: 'user', text: userMessage });
  state.chats[room].push({ role: 'assistant', text: response });

  state.resonance.score = Math.max(0.4, Math.min(0.98, state.resonance.score + (userMessage.length > 50 ? -0.06 : 0.01)));
  resonanceByRole[role.id] = Number((state.resonance.score - Math.random() * 0.07).toFixed(2));
  driftTracker.recordInteraction(state.resonance.score);

  freezeResonanceMoment({ role, userMessage, response, fingerprint, resonanceScore: state.resonance.score });
  state.freezeTrail = JSON.parse(localStorage.getItem('freeze_trail') || '[]');
  await checkAdaptiveRegeneration(role, resonanceByRole[role.id]);

  els.chatInput.value = '';
  renderChat();
}

function onRunTournament() {
  const industries = ['Tech SaaS', 'Traditional Bank', 'Manufacturing Giant', 'Healthcare'];
  const summary = runTournament({ scenarioId: els.tournamentScenario.value, industries, roleData });
  const leaderboard = (summary.results || []).map((row, idx) => `${idx + 1}. ${row.industry} score=${row.universalScore}`).join('\n');
  els.tournamentOutput.textContent = `${renderTournamentResult(summary)}\n\nLeaderboard\n${leaderboard}`;
}

async function onGenerateRoles(promptMode = 'advanced') {
  const industry = els.generatorIndustry.value.trim();
  const count = Number(els.generatorCount.value || 8);
  if (!industry) {
    els.generatorStatus.textContent = 'กรุณาระบุ industry ก่อน generate';
    return;
  }

  els.generatorStatus.textContent = 'กำลัง generate roles...';
  const generated = await generateRolesForIndustry(industry, count, 'mixed', promptMode);
  const { accepted, rejected } = validateGeneratedRoles(generated, 0.3);
  rejected.forEach(({ role, drift }) => {
    freezeResonanceMoment({
      role: selectedRole(),
      userMessage: `[validation reject] ${role.title || 'unknown'}`,
      response: `Role generation rejected due to drift=${drift}`,
      fingerprint: buildResonanceFingerprint(state.resonance),
      resonanceScore: state.resonance.score,
      intervention: { validation_reject: true, drift },
    });
  });
  const deduped = addGeneratedRoles(accepted);
  els.generatorStatus.textContent = `เพิ่ม ${deduped.length} roles (reject ${rejected.length} drift)`;
  renderAll();
}

async function onGenerateBatch() {
  const industry = els.generatorIndustry.value.trim();
  const count = Number(els.generatorCount.value || 8);
  pendingBatch = await generateRolesForIndustry(industry, count, 'mixed', 'basic');
  const { accepted, rejected } = validateGeneratedRoles(pendingBatch, 0.3);
  pendingBatch = accepted;
  els.batchPreview.classList.remove('hidden');
  els.batchPreview.innerHTML = [
    `<div class="mb-1 text-slate-300">Preview ${accepted.length} roles (rejected ${rejected.length})</div>`,
    ...accepted.map((role) => `<div class="border-b border-slate-700 py-1">${role.title} • ${role.tier}</div>`),
  ].join('');
}

function onCommitBatch() {
  const inserted = addGeneratedRoles(pendingBatch);
  els.generatorStatus.textContent = `Committed batch ${inserted.length} roles`;
  pendingBatch = [];
  els.batchPreview.classList.add('hidden');
  renderAll();
}

async function onCrossTournament() {
  const selected = [...els.companyTypeSelect.selectedOptions].map((option) => option.value);
  const companyTypes = selected.length ? selected : ['tech-startup', 'traditional-corp'];
  const scenarioName = crisisScenarios.find((item) => item.id === els.tournamentScenario.value)?.name || 'Crisis Scenario';
  const result = await runCrossCompanyTournament(scenarioName, companyTypes);
  latestCrossTournament = result;
  els.crossTournamentOutput.textContent = renderCrossCompanyResult(result);
  renderGovernanceChart();
}

function renderHub() {
  els.hubGrid.innerHTML = hubSoftwares
    .map((software) => `<button class="hub-software-btn rounded border border-slate-700 bg-slate-900 p-2 text-sm text-left">${software}</button>`)
    .join('');

  const options = hubSoftwares.map((software) => `<option>${software}</option>`).join('');
  els.integrationA.innerHTML = options;
  els.integrationB.innerHTML = options;

  document.querySelectorAll('.hub-software-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const software = btn.textContent.trim();
      const industry = software.includes('Workday') || software.includes('Oracle') ? 'Traditional Bank' : 'Tech SaaS';
      const suggested = roleData.filter((role) => role.industry === industry).slice(0, 3).map((role) => role.title);
      els.hubOutput.textContent = `Loaded ${software}\nSuggested roles: ${suggested.join(', ')}`;
    });
  });
}

async function onSimulateIntegration() {
  const a = els.integrationA.value;
  const b = els.integrationB.value;
  const prompt = `Simulate integration data flow between ${a} and ${b}. Include skills synchronization and budget impact.`;
  const response = await llmRespond(prompt, { mode: 'global', temperature: 0.5 });
  els.hubOutput.textContent = response;
}

let governanceChart;
function renderGovernanceChart() {
  if (!window.Chart || !els.governanceChart) return;
  const trail = JSON.parse(localStorage.getItem('freeze_trail') || '[]');
  const highResonance = trail.filter((row) => Number(row.resonance_score || 0) > 0.9).length;
  const driftIncidents = trail.filter((row) => row.intervention).length;
  const tournamentScore = Number((latestCrossTournament?.ranking?.[0]?.score || 0.7));

  if (governanceChart) governanceChart.destroy();
  governanceChart = new window.Chart(els.governanceChart, {
    type: 'bar',
    data: {
      labels: ['Resonance>0.9', 'Drift Incidents', 'Top Tournament Score'],
      datasets: [{ label: 'Governance Metrics', data: [highResonance, driftIncidents, tournamentScore], backgroundColor: ['#34d399', '#f97316', '#60a5fa'] }],
    },
    options: { scales: { y: { beginAtZero: true } }, plugins: { legend: { display: false } } },
  });
}

function bind() {
  els.sendBtn.addEventListener('click', onSend);
  els.chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') onSend(); });
  els.modeGlobal.addEventListener('click', () => { state.chatMode = 'global'; renderChat(); });
  els.modeRole.addEventListener('click', () => { state.chatMode = 'role'; renderChat(); });
  els.chatRoleSelect.addEventListener('change', (e) => { state.selectedRoleId = e.target.value; renderAll(); });
  els.cLevelMode.addEventListener('change', () => { adjustByCLevelMode(); renderChat(); });
  [els.speed, els.depth, els.format, els.contextMode].forEach((el) => el.addEventListener('change', renderChat));
  els.workspacePreset.addEventListener('change', (e) => { activePreset = e.target.value; renderAll(); });
  els.cardTabRole.addEventListener('click', () => { showSkillsView = false; renderTabs(); renderAll(); });
  els.cardTabSkills.addEventListener('click', () => { showSkillsView = true; renderTabs(); renderAll(); });

  els.runTournament.addEventListener('click', onRunTournament);
  els.generateRoles.addEventListener('click', () => onGenerateRoles('advanced'));
  els.generateBatch.addEventListener('click', onGenerateBatch);
  els.commitBatch.addEventListener('click', onCommitBatch);
  els.runCrossTournament.addEventListener('click', onCrossTournament);
  els.exportPolicies.addEventListener('click', () => {
    if (latestCrossTournament) exportTournamentPolicies(latestCrossTournament);
  });

  els.exportOrgPng.addEventListener('click', async () => {
    const ok = await exportOrgChart('png');
    if (!ok) els.generatorStatus.textContent = 'ไม่สามารถ export PNG ได้';
  });
  els.exportOrgSvg.addEventListener('click', async () => {
    const ok = await exportOrgChart('svg');
    if (!ok) els.generatorStatus.textContent = 'ไม่สามารถ export SVG ได้';
  });
  els.quickGenerateMissing.addEventListener('click', () => onGenerateRoles('basic'));

  els.simulateIntegration.addEventListener('click', onSimulateIntegration);
}

function renderTabs() {
  els.cardTabRole.className = `px-2 py-1 rounded ${showSkillsView ? 'text-slate-300' : 'bg-accent text-slate-900'}`;
  els.cardTabSkills.className = `px-2 py-1 rounded ${showSkillsView ? 'bg-accent text-slate-900' : 'text-slate-300'}`;
  els.skillsOverlayPanel.classList.toggle('hidden', !showSkillsView);
  els.roleCard.classList.toggle('hidden', showSkillsView);
}

function renderAll() {
  renderRoles();
  renderSelects();
  renderChat();
  renderTabs();
  renderGovernanceChart();
}

renderHub();
bind();
renderAll();
