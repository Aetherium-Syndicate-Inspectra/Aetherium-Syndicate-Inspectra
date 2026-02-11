const roleHierarchy = {
  cSuite: [
    {
      level: 'Core',
      titles: [
        'CEO (Chief Executive Officer)',
        'COO (Chief Operating Officer)',
        'CFO (Chief Financial Officer)',
        'CTO (Chief Technology Officer)',
        'CIO (Chief Information Officer)',
        'CMO (Chief Marketing Officer)',
        'CHRO / Chief People Officer',
        'CISO (Chief Information Security Officer)',
        'CPO (Chief Product Officer)',
      ],
    },
    {
      level: 'Modern / Extended',
      titles: [
        'Chief Visionary Officer',
        'Chief Growth Officer',
        'Chief Revenue Officer',
        'Chief Investment Officer',
        'Chief Digital Officer',
        'Chief Innovation Officer',
        'Chief Data Officer',
        'Chief AI Officer',
        'Chief Brand Officer',
        'Chief Experience Officer',
        'Chief Diversity Officer',
        'Chief Wellbeing Officer',
        'Chief Security Officer',
        'Chief Privacy Officer',
        'Chief Design Officer',
        'Chief Sustainability Officer',
        'Chief Compliance Officer',
      ],
    },
  ],
  vpDirectorHead: [
    'VP of Engineering',
    'VP of Product',
    'VP of Sales',
    'VP of Marketing',
    'VP of Data & AI',
    'VP of Operations',
    'VP of Finance',
    'VP of HR',
    'VP of Legal / General Counsel',
    'Head of DevOps',
    'Head of Cybersecurity',
    'Head of Customer Success',
  ],
  managerLead: [
    'Engineering Manager',
    'Tech Lead / Squad Lead',
    'Product Manager',
    'Marketing Manager',
    'Sales Manager / Account Manager',
    'Data Manager / Analytics Lead',
    'QA Manager / Test Lead',
    'HR Manager / Recruiter Lead',
  ],
  individualContributor: {
    techEngineering: [
      'Software Engineer (Frontend / Backend / Full-Stack / Mobile)',
      'DevOps Engineer / SRE',
      'Cloud Engineer / Platform Engineer',
      'Data Engineer / ML Engineer / AI Researcher',
      'UI/UX Designer / Product Designer',
      'QA Engineer / Automation Tester',
    ],
    dataAI: [
      'Data Analyst',
      'Data Scientist',
      'Business Intelligence Analyst',
      'Machine Learning Engineer',
    ],
    businessNonTech: [
      'Sales Representative / Business Development Rep',
      'Marketing Specialist / SEO Specialist / Content Creator',
      'Accountant / Financial Analyst',
      'HR Specialist / Recruiter',
      'Customer Support Specialist / Success Manager',
    ],
  },
};

export const companyTypeTemplates = {
  techStartup: {
    key: 'tech-startup',
    label: 'Tech Startup',
    emphasis: 'CTO-heavy',
    roleRange: '10-50 core roles',
    aiAgentRange: '5-10 AI agents',
  },
  traditionalCorp: {
    key: 'traditional-corp',
    label: 'Traditional Corporation',
    emphasis: 'COO-heavy',
    roleRange: '100-300 modular roles',
    aiAgentRange: 'multi-team AI mesh',
  },
  enterpriseNetwork: {
    key: 'enterprise-network',
    label: 'Large Enterprise Network',
    emphasis: 'board-governed CxO council',
    roleRange: '500-5,000+ roles',
    aiAgentRange: 'high-scale archetype spawning',
  },
};

export const industryTemplates = [
  {
    id: 'tech_saas',
    name: 'Tech SaaS',
    cLevelProfile: ['CEO', 'CTO', 'CPO', 'CISO', 'Chief AI Officer'],
    focus: 'product velocity + platform reliability',
  },
  {
    id: 'traditional_bank',
    name: 'Traditional Bank',
    cLevelProfile: ['CEO', 'COO', 'CFO', 'CIO', 'Chief Compliance Officer'],
    focus: 'risk governance + regulatory resilience',
  },
  {
    id: 'manufacturing_giant',
    name: 'Manufacturing Giant',
    cLevelProfile: ['CEO', 'COO', 'CFO', 'CTO', 'Chief Sustainability Officer'],
    focus: 'supply chain optimization + quality assurance',
  },
];

const curatedRoleData = [
  { id: 'saas_ceo', title: 'SaaS CEO', industry: 'Tech SaaS', tier: 'C-Level', focus: 'Portfolio vision and market timing', kpi: 'ARR growth + retention', horizon: '3Y', capability: ['Strategy orchestration', 'Capital narrative'] },
  { id: 'saas_cto', title: 'SaaS CTO', industry: 'Tech SaaS', tier: 'C-Level', focus: 'Platform architecture and AI acceleration', kpi: 'Uptime + release velocity', horizon: '3Y', capability: ['Platform strategy', 'Innovation governance'] },
  { id: 'bank_coo', title: 'Bank COO', industry: 'Traditional Bank', tier: 'C-Level', focus: 'Operational risk and branch performance', kpi: 'Process SLA + cost-to-serve', horizon: '3Y', capability: ['Process governance', 'Service resilience'] },
  { id: 'bank_compliance', title: 'Chief Compliance Officer', industry: 'Traditional Bank', tier: 'C-Level', focus: 'Regulatory assurance and control', kpi: 'Audit pass rate', horizon: '3Y', capability: ['Regulatory oversight', 'Control framework'] },
  { id: 'mfg_cso', title: 'Chief Sustainability Officer', industry: 'Manufacturing Giant', tier: 'C-Level', focus: 'Decarbonization and lifecycle governance', kpi: 'Emission intensity', horizon: '3Y', capability: ['Sustainability policy', 'Supplier compliance'] },

  { id: 'eng_vp', title: 'VP of Engineering', industry: 'Tech SaaS', tier: 'Leadership', focus: 'Engineering system health', kpi: 'Lead time for change', horizon: 'Quarterly', capability: ['Org design', 'Execution cadence'] },
  { id: 'growth_vp', title: 'VP of Marketing / Growth', industry: 'Tech SaaS', tier: 'Leadership', focus: 'Demand engine orchestration', kpi: 'Pipeline velocity', horizon: 'Quarterly', capability: ['Growth experiments', 'Attribution governance'] },
  { id: 'bank_risk_head', title: 'Head of Cybersecurity & Risk', industry: 'Traditional Bank', tier: 'Leadership', focus: 'Threat posture and controls', kpi: 'Mean time to contain', horizon: 'Quarterly', capability: ['Risk triage', 'Incident command'] },
  { id: 'mfg_supply_head', title: 'Head of Supply Chain', industry: 'Manufacturing Giant', tier: 'Leadership', focus: 'Network resilience', kpi: 'OTIF + inventory turns', horizon: 'Quarterly', capability: ['Constraint planning', 'Vendor orchestration'] },

  { id: 'squad_lead', title: 'Engineering Manager / Squad Lead', industry: 'Tech SaaS', tier: 'Manager/Lead', focus: 'Delivery reliability', kpi: 'Sprint commitment accuracy', horizon: 'Monthly', capability: ['Team coaching', 'Delivery governance'] },
  { id: 'pm_manager', title: 'Product Manager', industry: 'Tech SaaS', tier: 'Manager/Lead', focus: 'Problem-solution fit execution', kpi: 'Feature adoption', horizon: 'Monthly', capability: ['Roadmap slicing', 'Outcome reviews'] },
  { id: 'bank_ops_manager', title: 'Operations Manager', industry: 'Traditional Bank', tier: 'Manager/Lead', focus: 'Branch flow and escalation', kpi: 'Service wait time', horizon: 'Monthly', capability: ['Workflow control', 'Escalation response'] },
  { id: 'mfg_quality_manager', title: 'Quality Control Manager', industry: 'Manufacturing Giant', tier: 'Manager/Lead', focus: 'Defect prevention', kpi: 'First-pass yield', horizon: 'Monthly', capability: ['Root-cause elimination', 'Inspection governance'] },

  { id: 'frontend_engineer', title: 'Frontend Software Engineer', industry: 'Tech SaaS', tier: 'IC/Specialist', focus: 'UX performance and accessibility', kpi: 'Core Web Vitals', horizon: 'Weekly', capability: ['UI engineering', 'Testing discipline'] },
  { id: 'ml_engineer', title: 'Machine Learning Engineer', industry: 'Tech SaaS', tier: 'IC/Specialist', focus: 'Model quality and rollout safety', kpi: 'Model precision + rollback rate', horizon: 'Weekly', capability: ['MLOps', 'Evaluation systems'] },
  { id: 'risk_analyst', title: 'Risk Analyst', industry: 'Traditional Bank', tier: 'IC/Specialist', focus: 'Risk signal interpretation', kpi: 'False-positive reduction', horizon: 'Weekly', capability: ['Quant analysis', 'Control tuning'] },
  { id: 'compliance_officer', title: 'Compliance Officer', industry: 'Traditional Bank', tier: 'IC/Specialist', focus: 'Policy conformance checks', kpi: 'Control breach count', horizon: 'Weekly', capability: ['Policy validation', 'Regulatory reporting'] },
  { id: 'supply_chain_planner', title: 'Supply Chain Planner', industry: 'Manufacturing Giant', tier: 'IC/Specialist', focus: 'Demand-supply alignment', kpi: 'Forecast accuracy', horizon: 'Weekly', capability: ['Planning optimization', 'Scenario simulation'] },
  { id: 'logistics_coordinator', title: 'Logistics Coordinator', industry: 'Manufacturing Giant', tier: 'IC/Specialist', focus: 'Shipment execution integrity', kpi: 'Delivery adherence', horizon: 'Daily', capability: ['Dispatch control', 'Carrier coordination'] },

  { id: 'healthcare_researcher', title: 'Medical Research Specialist', industry: 'Healthcare', tier: 'IC/Specialist', focus: 'Clinical insight generation', kpi: 'Protocol throughput', horizon: 'Monthly', capability: ['Trial analysis', 'Evidence synthesis'] },
  { id: 'retail_merchandiser', title: 'Merchandiser', industry: 'Retail / E-commerce', tier: 'IC/Specialist', focus: 'Assortment performance', kpi: 'Sell-through rate', horizon: 'Weekly', capability: ['Category planning', 'Promotion calibration'] },
  { id: 'education_curriculum', title: 'Curriculum Designer', industry: 'Education', tier: 'IC/Specialist', focus: 'Learning outcome architecture', kpi: 'Course completion quality', horizon: 'Quarterly', capability: ['Instructional design', 'Outcome measurement'] },
];

export const roleData = curatedRoleData;
export const tierOrder = ['C-Level', 'Leadership', 'Manager/Lead', 'IC/Specialist'];
export const registryHierarchy = roleHierarchy;


const companyTypeIndustryMap = {
  'tech-startup': ['Tech SaaS'],
  'traditional-corp': ['Traditional Bank'],
  'enterprise-network': ['Manufacturing Giant', 'Healthcare', 'Retail / E-commerce', 'Education'],
};

export function loadCompanyTemplate(companyTypeKey) {
  const industries = companyTypeIndustryMap[companyTypeKey] || [];
  return roleData.filter((role) => industries.includes(role.industry));
}

export function addGeneratedRoles(newRoles = []) {
  const existingIds = new Set(roleData.map((role) => role.id));
  const deduped = newRoles.filter((role) => role && role.id && !existingIds.has(role.id));
  deduped.forEach((role) => existingIds.add(role.id));
  roleData.push(...deduped);
  return deduped;
}
