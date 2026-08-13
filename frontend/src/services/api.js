/**
 * Centralized API Service Layer for Voice-Enabled RAG Application.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Helper to handle HTTP API response JSON and structured errors.
 */
async function handleResponse(response) {
  const contentType = response.headers.get('content-type');
  let data = null;

  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMessage =
      (data && data.error && data.error.message) ||
      (typeof data === 'string' ? data : `HTTP ${response.status} Error`);
    
    const error = new Error(errorMessage);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
}

/**
 * GET /health - Check backend system health and vector DB connection status.
 */
export async function healthCheck() {
  const response = await fetch(`${API_BASE_URL}/health`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });
  return handleResponse(response);
}

/**
 * POST /api/query - Submit text-based RAG query.
 */
export async function queryText(queryTextStr, language = 'en', topK = 5, enableHybrid = true) {
  const response = await fetch(`${API_BASE_URL}/api/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      query: queryTextStr,
      language,
      top_k: topK,
      enable_hybrid: enableHybrid,
    }),
  });
  return handleResponse(response);
}

/**
 * POST /api/voice/query - Submit voice audio RAG query.
 */
export async function queryVoice(audioFile, languageCode = 'hi-IN') {
  const formData = new FormData();
  if (audioFile) {
    formData.append('file', audioFile);
  }
  formData.append('language_code', languageCode);

  const response = await fetch(`${API_BASE_URL}/api/voice/query`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
    },
    body: formData,
  });
  return handleResponse(response);
}
