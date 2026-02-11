const fallbackSkillsByRole = {
  saas_ceo: [
    { label: 'Portfolio Vision', confidence: 0.95 },
    { label: 'Market Timing', confidence: 0.85 },
    { label: 'Capital Narrative', confidence: 0.9 },
  ],
  frontend_engineer: [
    { label: 'React', confidence: 0.92 },
    { label: 'Accessibility', confidence: 0.9 },
    { label: 'Performance Budgeting', confidence: 0.87 },
  ],
  ml_engineer: [
    { label: 'MLOps', confidence: 0.91 },
    { label: 'Model Evaluation', confidence: 0.9 },
    { label: 'Feature Pipelines', confidence: 0.86 },
  ],
};

function toGraphElements(role) {
  const roleNode = { data: { id: role.id, label: role.title, type: 'role' } };
  const skills = role.skillsConfidence || fallbackSkillsByRole[role.id] || [
    { label: 'Cross-functional Collaboration', confidence: 0.82 },
    { label: 'Execution Discipline', confidence: 0.8 },
  ];

  const skillNodes = skills.map((skill, idx) => ({
    data: {
      id: `${role.id}_skill_${idx}`,
      label: `${skill.label} (${skill.confidence.toFixed(2)})`,
      type: 'skill',
      confidence: skill.confidence,
    },
  }));

  const edges = skillNodes.map((node) => ({
    data: {
      source: role.id,
      target: node.data.id,
      weight: Number(node.data.confidence || 0.75),
    },
  }));

  return [roleNode, ...skillNodes, ...edges];
}

export function renderSkillsFirstOverlay(containerId, role) {
  const container = document.getElementById(containerId);
  if (!container || !role) return null;
  if (typeof window.cytoscape !== 'function') {
    container.innerHTML = '<p class="text-xs text-rose-300">Cytoscape.js not loaded.</p>';
    return null;
  }

  container.innerHTML = '';
  const cy = window.cytoscape({
    container,
    elements: toGraphElements(role),
    style: [
      { selector: 'node[type="role"]', style: { 'background-color': '#2563eb', label: 'data(label)', color: '#fff', 'font-size': 12, 'text-valign': 'center' } },
      { selector: 'node[type="skill"]', style: { 'background-color': '#16a34a', label: 'data(label)', color: '#fff', 'font-size': 11, shape: 'round-rectangle', padding: 6, 'text-wrap': 'wrap', 'text-max-width': 120 } },
      { selector: 'edge', style: { width: 'mapData(weight, 0.5, 1, 1, 5)', 'line-color': '#94a3b8', 'target-arrow-color': '#94a3b8', 'target-arrow-shape': 'triangle', 'curve-style': 'bezier' } },
    ],
    layout: { name: 'cose', animate: true, nodeDimensionsIncludeLabels: true },
  });

  cy.on('tap', 'node', (evt) => {
    const node = evt.target;
    const detail = document.getElementById('skillsNodeDetail');
    if (detail) detail.textContent = `${node.data('label')} • type=${node.data('type')}`;
  });

  window.addEventListener('resize', () => cy.resize(), { once: true });
  return cy;
}
