import { tierOrder } from '../models/roleRegistry.js';

function resonanceClass(score = 0.8) {
  if (score >= 0.9) return 'border-emerald-400/60';
  if (score >= 0.75) return 'border-amber-400/60';
  return 'border-rose-400/70';
}

export function renderRoleNavigator({ roleData, selectedRoleId, resonanceByRole = {}, activePreset = 'all' }) {
  const grouped = roleData.reduce((acc, role) => {
    if (!acc[role.tier]) acc[role.tier] = [];
    acc[role.tier].push(role);
    return acc;
  }, {});

  return tierOrder.map((tier) => {
    const list = grouped[tier] || [];
    return `
      <div>
        <h3 class="text-xs text-slate-400 mb-1 uppercase tracking-wider">${tier}</h3>
        <div class="space-y-1">
          ${list.map((role) => {
            const score = resonanceByRole[role.id] || 0.8;
            return `
            <button data-role-id="${role.id}" class="role-btn w-full text-left rounded-lg border px-3 py-2 transition ${resonanceClass(score)} ${selectedRoleId === role.id ? 'bg-amber-400/20 border-amber-400' : 'bg-slate-900 hover:border-slate-500'}">
              <div class="text-sm font-medium flex items-center justify-between gap-2"><span>${role.title}</span><span class="text-[10px] text-slate-300">${score.toFixed(2)}</span></div>
              <div class="text-xs text-slate-400">${role.industry} • ${role.focus}</div>
            </button>
          `;
          }).join('')}
        </div>
      </div>
    `;
  }).join('') + `<div class="mt-2 text-[11px] text-slate-500">Preset: ${activePreset}</div>`;
}

export function renderRoleCard(role, templateWeight = 1) {
  return `
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">${role.title}</h3>
        <span class="text-xs px-2 py-1 rounded bg-slate-800">${role.industry} • w=${templateWeight.toFixed(2)}</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
        <div class="rounded-lg border border-slate-600 p-2 bg-slate-900/60"><div class="text-slate-400 text-xs">focus</div><div>${role.focus}</div></div>
        <div class="rounded-lg border border-slate-600 p-2 bg-slate-900/60"><div class="text-slate-400 text-xs">kpi</div><div>${role.kpi}</div></div>
        <div class="rounded-lg border border-slate-600 p-2 bg-slate-900/60"><div class="text-slate-400 text-xs">horizon</div><div>${role.horizon}</div></div>
        <div class="rounded-lg border border-slate-600 p-2 bg-slate-900/60"><div class="text-slate-400 text-xs">capability</div><div>${role.capability.join(', ')}</div></div>
      </div>
      <div class="flex flex-wrap gap-2 pt-1">
        <button id="promoteRoleBtn" class="px-3 py-1 rounded bg-emerald-500 text-slate-900 text-xs font-semibold">Promote Role</button>
        <button id="archiveRoleBtn" class="px-3 py-1 rounded bg-rose-500 text-white text-xs font-semibold">Archive Role</button>
      </div>
    </div>
  `;
}
