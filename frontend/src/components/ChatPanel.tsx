import { FormEvent, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Send } from 'lucide-react';
import { systemApi } from '../services/apiClient';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export function ChatPanel() {
  const [prompt, setPrompt] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'boot-assistant-message',
      role: 'assistant',
      content: 'พร้อมปฏิบัติการแล้วครับ ส่งคำถามมาได้เลย ผมจะเรียกใช้ LLM ภายในระบบ (Cogitator-X) เพื่อตอบกลับแบบเรียลไทม์',
      timestamp: new Date().toISOString(),
    },
  ]);

  const hasMessages = useMemo(() => messages.length > 0, [messages]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || isSending) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmedPrompt,
      timestamp: new Date().toISOString(),
    };

    setMessages((previous) => [...previous, userMessage]);
    setPrompt('');
    setIsSending(true);
    setErrorMessage(null);

    try {
      const response = await systemApi.chatWithInternalLlm(trimmedPrompt);
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.data.answer,
        timestamp: new Date().toISOString(),
      };
      setMessages((previous) => [...previous, assistantMessage]);
    } catch {
      setErrorMessage('ไม่สามารถเชื่อมต่อ LLM ภายในระบบได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card-glass rounded-2xl p-6">
        <h2 className="text-2xl font-bold text-white">
          💬 Internal <span className="glow-text text-cyan-glow">LLM Chat</span>
        </h2>
        <p className="mt-2 text-sm text-white/40">
          สนทนาโดยตรงกับ Cogitator-X Engine ผ่าน API ภายในระบบเพื่อขอคำแนะนำ วิเคราะห์ข้อมูล และช่วยตัดสินใจเชิงปฏิบัติการ
        </p>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-4">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card-glass rounded-2xl p-4 md:p-5"
        >
          <div className="h-[480px] overflow-y-auto pr-1 space-y-3">
            {hasMessages &&
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`rounded-xl border px-4 py-3 max-w-[88%] ${
                    message.role === 'assistant'
                      ? 'border-cyan-glow/20 bg-cyan-glow/5 text-white/90'
                      : 'ml-auto border-purple-glow/30 bg-purple-glow/10 text-white'
                  }`}
                >
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/35 mb-1">
                    {message.role === 'assistant' ? 'Cogitator-X' : 'Operator'}
                  </p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  <p className="mt-2 text-[10px] text-white/25">
                    {new Date(message.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={3}
              placeholder="พิมพ์คำถามถึง LLM ภายในระบบ..."
              className="w-full resize-none rounded-xl border border-cyan-glow/20 bg-aether-800/70 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-glow/50"
            />

            {errorMessage && <p className="text-xs text-red-300">{errorMessage}</p>}

            <div className="flex items-center justify-between">
              <p className="text-[11px] text-white/35">ข้อมูลไม่ถูกส่งออกภายนอกระบบ</p>
              <button
                type="submit"
                disabled={isSending || !prompt.trim()}
                className="inline-flex items-center gap-2 rounded-lg border border-cyan-glow/30 bg-cyan-glow/10 px-4 py-2 text-xs font-semibold text-cyan-glow disabled:opacity-50"
              >
                {isSending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                {isSending ? 'กำลังประมวลผล...' : 'ส่งข้อความ'}
              </button>
            </div>
          </form>
        </motion.section>

        <motion.aside
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-glass rounded-2xl p-5 space-y-4"
        >
          <h3 className="text-sm font-semibold text-white/90">System Link</h3>
          <div className="space-y-2 text-xs">
            <StatusRow label="Endpoint" value="/api/v1/chat/llm" />
            <StatusRow label="Provider" value="Cogitator-X (internal)" />
            <StatusRow label="Mode" value="Thai + English reasoning" />
            <StatusRow label="Transport" value="HTTPS (local gateway)" />
          </div>
        </motion.aside>
      </div>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-cyan-glow/10 bg-aether-800/60 px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.18em] text-white/35">{label}</p>
      <p className="mt-0.5 text-xs text-cyan-glow/90">{value}</p>
    </div>
  );
}
