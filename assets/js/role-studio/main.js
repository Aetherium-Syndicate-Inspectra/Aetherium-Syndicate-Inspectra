import { roleData, industryTemplates, companyTypeTemplates, addGeneratedRoles } from './models/roleRegistry.js';
import { runTournament, crisisScenarios } from './models/crisisScenario.js';
import { state, getRoomKey } from './core/state.js';
import { buildResonanceFingerprint, DriftTracker, applyIntervention } from './core/resonance.js';
import { llmRespond } from './core/llm.js';
import { freezeResonanceMoment } from './services/freezeLight.js';
import { renderRoleNavigator, renderRoleCard } from './views/roleNavigator.js';
import { renderChatMessages, appendSystemMessage } from './views/chatWindow.js';
import { renderTournamentResult } from './views/impactBoard.js';
import { generateRolesForIndustry } from './utils/roleGenerator.js';
import { runCrossCompanyTournament, renderCrossCompanyResult } from './utils/crossCompanySimulation.js';
import { exportOrgChart } from './utils/exportOrgChart.js';

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
  generatorStatus: document.getElementById('generatorStatus'),
  exportOrgPng: document.getElementById('exportOrgPng'),
  exportOrgSvg: document.getElementById('exportOrgSvg'),
  orgChartContainer: document.getElementById('orgChartContainer'),
};

function selectedRole() {
  return roleData.find((r) => r.id === state.selectedRoleId) || roleData[0];
}

function renderOrgChart() {
  const grouped = roleData.reduce((acc, role) => {
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

  els.orgChartContainer.innerHTML = `<div class="grid md:grid-cols-2 xl:grid-cols-3 gap-3">${blocks}</div>`;
}

function renderRoles() {
  els.roleGroups.innerHTML = renderRoleNavigator({ roleData, selectedRoleId: state.selectedRoleId });
  const industryCount = new Set(roleData.map((r) => r.industry)).size;
  els.roleCount.textContent = `${roleData.length} roles / ${industryCount} industries (${industryTemplates.length} templates)`;
  els.roleCard.innerHTML = renderRoleCard(selectedRole());
  renderOrgChart();

  document.querySelectorAll('.role-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.selectedRoleId = btn.dataset.roleId;
      renderAll();
    });
  });
}

function renderSelects() {
  const options = roleData.map((r) => `<option value="${r.id}" ${r.id === state.selectedRoleId ? 'selected' : ''}>${r.title}</option>`).join('');
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
  driftTracker.recordInteraction(state.resonance.score);

  freezeResonanceMoment({ role, userMessage, response, fingerprint, resonanceScore: state.resonance.score });
  state.freezeTrail = JSON.parse(localStorage.getItem('freeze_trail') || '[]');

  els.chatInput.value = '';
  renderChat();
}

function onRunTournament() {
  const industries = ['Tech SaaS', 'Traditional Bank', 'Manufacturing Giant', 'Healthcare'];
  const summary = runTournament({ scenarioId: els.tournamentScenario.value, industries, roleData });
  els.tournamentOutput.textContent = renderTournamentResult(summary);
}

async function onGenerateRoles() {
  const industry = els.generatorIndustry.value.trim();
  const count = Number(els.generatorCount.value || 8);
  if (!industry) {
    els.generatorStatus.textContent = 'กรุณาระบุ industry ก่อน generate';
    return;
  }

  els.generatorStatus.textContent = 'กำลัง generate roles...';
  const generated = await generateRolesForIndustry(industry, count, 'mixed');
  const deduped = addGeneratedRoles(generated);
  els.generatorStatus.textContent = `เพิ่ม ${deduped.length} roles (dedupe แล้ว)`;
  if (deduped.length && !roleData.find((role) => role.id === state.selectedRoleId)) {
    state.selectedRoleId = deduped[0].id;
  }
  renderAll();
}

async function onCrossTournament() {
  const selected = [...els.companyTypeSelect.selectedOptions].map((option) => option.value);
  const companyTypes = selected.length ? selected : ['tech-startup', 'traditional-corp'];
  const scenarioName = crisisScenarios.find((item) => item.id === els.tournamentScenario.value)?.name || 'Crisis Scenario';
  const result = await runCrossCompanyTournament(scenarioName, companyTypes);
  els.crossTournamentOutput.textContent = renderCrossCompanyResult(result);
}

function bind() {
  els.sendBtn.addEventListener('click', onSend);
  els.chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') onSend(); });
  els.modeGlobal.addEventListener('click', () => { state.chatMode = 'global'; renderChat(); });
  els.modeRole.addEventListener('click', () => { state.chatMode = 'role'; renderChat(); });
  els.chatRoleSelect.addEventListener('change', (e) => { state.selectedRoleId = e.target.value; renderAll(); });
  els.cLevelMode.addEventListener('change', () => { adjustByCLevelMode(); renderChat(); });
  [els.speed, els.depth, els.format, els.contextMode].forEach((el) => el.addEventListener('change', renderChat));
  els.runTournament.addEventListener('click', onRunTournament);
  els.generateRoles.addEventListener('click', onGenerateRoles);
  els.runCrossTournament.addEventListener('click', onCrossTournament);
  els.exportOrgPng.addEventListener('click', async () => {
    const ok = await exportOrgChart('png');
    if (!ok) els.generatorStatus.textContent = 'ไม่สามารถ export PNG ได้';
  });
  els.exportOrgSvg.addEventListener('click', async () => {
    const ok = await exportOrgChart('svg');
    if (!ok) els.generatorStatus.textContent = 'ไม่สามารถ export SVG ได้';
  });
}

function renderAll() {
  renderRoles();
  renderSelects();
  renderChat();
}

bind();
renderAll();
