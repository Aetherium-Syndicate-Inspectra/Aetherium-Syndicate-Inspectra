import { roleData } from '../models/roleRegistry.js';

export const state = {
  selectedRoleId: roleData[0].id,
  chatMode: 'global',
  chats: { global: [] },
  resonance: {
    speed: 0.6,
    depth: 'summary',
    format: 'numbers',
    contextMode: 'strategic',
    score: 0.91,
  },
  cLevelMode: 'visionary',
  freezeTrail: JSON.parse(localStorage.getItem('freeze_trail') || '[]'),
};

export function getRoomKey(selectedRoleId, chatMode) {
  return chatMode === 'global' ? 'global' : `role:${selectedRoleId}`;
}
