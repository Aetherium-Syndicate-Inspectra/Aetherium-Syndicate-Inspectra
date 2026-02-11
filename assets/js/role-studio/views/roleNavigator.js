import { tierOrder } from '../models/roleRegistry.js';

export function renderRoleNavigator({ roleData, selectedRoleId }) {
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
          ${list.map((role) => `
            <button data-role-id="${role.id}" class="role-btn w-full text-left rounded-lg border px-3 py-2 transition ${selectedRoleId === role.id ? 'bg-amber-400/20 border-amber-400' : 'bg-slate-900 border-slate-700 hover:border-slate-500'}">
              <div class="text-sm font-medium">${role.title}</div>
              <div class="text-xs text-slate-400">${role.industry} • ${role.focus}</div>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}

export function renderRoleCard(role) {
  return `
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">${role.title}</h3>
        <span class="text-xs px-2 py-1 rounded bg-slate-800">${role.industry}</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
        <div class="rounded-lg border border-slate-600 p-2 bg-slate-900/60"><div class="text-slate-400 text-xs">focus</div><div>${role.focus}</div></div>
        <div class="rounded-lg border border-slate-600 p-2 bg-slate-900/60"><div class="text-slate-400 text-xs">kpi</div><div>${role.kpi}</div></div>
        <div class="rounded-lg border border-slate-600 p-2 bg-slate-900/60"><div class="text-slate-400 text-xs">horizon</div><div>${role.horizon}</div></div>
        <div class="rounded-lg border border-slate-600 p-2 bg-slate-900/60"><div class="text-slate-400 text-xs">capability</div><div>${role.capability.join(', ')}</div></div>
      </div>
    </div>
  `;
}
