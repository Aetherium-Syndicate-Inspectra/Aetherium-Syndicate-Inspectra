export function renderChatMessages(messages) {
  return messages.map((m) => `
    <div class="${m.role === 'user' ? 'text-right' : 'text-left'}">
      <div class="inline-block max-w-[92%] rounded-xl px-3 py-2 text-sm whitespace-pre-line ${m.role === 'user' ? 'bg-amber-400 text-slate-900' : 'bg-slate-800 text-slate-100 border border-slate-600'}">${m.text}</div>
    </div>
  `).join('');
}

export function appendSystemMessage(messages, text) {
  messages.push({ role: 'assistant', text: `⚙️ ${text}` });
}
