const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://hackfest2-0-h34h.onrender.com";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

export const api = {
  createSession: () => request("/api/session", { method: "POST" }),
  pasteContent: (sessionId, content) =>
    request("/api/paste", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId, content })
    }),
  uploadFile: (file) => {
    const body = new FormData();
    body.append("file", file);
    return request("/api/upload", { method: "POST", body });
  },
  startGeneration: (sessionId, mode = "standard", options = {}) =>
    request("/api/generate", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId, mode, options })
    }),
  getProgress: (sessionId) => request(`/api/progress?session_id=${sessionId}`),
  getBrd: (sessionId) => request(`/api/brd?session_id=${sessionId}`),
  getInsights: (sessionId) => request(`/api/insights?session_id=${sessionId}`),
  getBoardroom: (sessionId) => request(`/api/boardroom?session_id=${sessionId}`),
  chat: (sessionId, message) =>
    request("/api/chat", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId, message })
    })
};
