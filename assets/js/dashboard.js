const councilData = [
  { name: 'Alpha-1', role: 'Chief Strategy Officer', status: 'Online' },
  { name: 'Beta-X', role: 'Chief Financial Officer', status: 'In Meeting' },
  { name: 'Gamma-7', role: 'Chief Operations Officer', status: 'Busy' }
];

const list = document.getElementById('council-list');
if (list) {
  list.innerHTML = councilData
    .map((agent) => `<li class="meeting"><div class="font-medium">${agent.name}</div><div class="text-xs text-slate-400">${agent.role}</div><div class="text-xs mt-1 text-violet-300">${agent.status}</div></li>`)
    .join('');
}

const modal = document.getElementById('directive-modal');
document.getElementById('new-directive-btn')?.addEventListener('click', () => modal?.classList.remove('hidden'));
document.getElementById('close-modal')?.addEventListener('click', () => modal?.classList.add('hidden'));

document.getElementById('directive-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  modal?.classList.add('hidden');
  alert('Directive submitted to Request Receiver Agent.');
});

document.getElementById('emergency-btn')?.addEventListener('click', () => {
  alert('Emergency Council has been summoned.');
});

setInterval(() => {
  const bar = document.getElementById('throughput-bar');
  if (!bar) return;
  const widths = ['w-2/3', 'w-3/4', 'w-4/5', 'w-full'];
  bar.className = `h-full bg-emerald-400 ${widths[Math.floor(Math.random() * widths.length)]}`;
}, 2500);
