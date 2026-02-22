
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      
      const apiFetch = async (url: string, options?: RequestInit) => {
        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      };
      
      export const systemApi = {
        getTachyonMetrics: () => apiFetch(`${API_BASE_URL}/api/v1/tachyon/metrics`),
        getResonanceStatus: () => apiFetch(`${API_BASE_URL}/api/v1/resonance/drift`),
        getAgents: () => apiFetch(`${API_BASE_URL}/api/v1/agents/council`),
        getGoogleConfig: () => apiFetch(`${API_BASE_URL}/api/auth/google/config`),
        chatWithInternalLlm: (prompt: string) =>
          apiFetch(`${API_BASE_URL}/api/v1/chat/llm`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt }),
          }),
      };