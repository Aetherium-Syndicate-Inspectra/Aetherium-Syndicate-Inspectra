export async function callLLM(role, userMessage, fingerprint) {
  const payload = {
    role_id: role.id,
    industry: role.industry,
    user_message: userMessage,
    resonance_fingerprint: fingerprint,
    governance_context: {
      contract_version: '4.2.6',
      require_heal: true,
    },
  };

  try {
    const response = await fetch('/api/aetherbus/llm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.reply || '[empty backend reply]';
  } catch {
    return null;
  }
}
