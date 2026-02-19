export interface DashboardTab {
  id: string;
  label: string;
  icon: string;
  description: string;
}

export const dashboardTabs: DashboardTab[] = [
  { id: 'overview', label: 'Overview', icon: '📊', description: 'ภาพรวมด้านความพร้อมของระบบทั้งหมด' },
  { id: 'agents', label: 'AI Council', icon: '🤖', description: 'ติดตามสถานะทีมเอเจนต์และผลการปฏิบัติการ' },
  { id: 'tachyon', label: 'Tachyon Core', icon: '⚡', description: 'วิเคราะห์ throughput และ latency เชิงลึก' },
  { id: 'resonance', label: 'Resonance', icon: '🔮', description: 'เฝ้าระวังความผิดปกติของรูปแบบข้อมูล' },
  { id: 'departments', label: 'Departments', icon: '🏢', description: 'มุมมองตามหน่วยธุรกิจและผลการประสานงาน' },
  { id: 'policies', label: 'Policies', icon: '📋', description: 'กำกับดูแลมาตรฐานและ compliance policy' },
  { id: 'chat', label: 'Chat Ops', icon: '💬', description: 'สนทนากับ LLM ภายในระบบเพื่อช่วยวิเคราะห์และตอบคำถามเชิงปฏิบัติการ' },
];
