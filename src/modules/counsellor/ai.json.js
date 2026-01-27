export function extractJsonObject(text) {
  if (!text) return null;

  // Try direct parse first
  try {
    return JSON.parse(text);
  } catch {}

  // Otherwise extract first {...} block
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;

  const candidate = text.slice(start, end + 1);
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

export function safeAiFallback({ stage, next, buckets }) {
  return {
    version: "1.0",
    stage,
    say: "Here are your recommendations based on your profile. I’ll explain fit + risks once AI is available.",
    profile_summary: { strengths: [], gaps: [], risks: [] },
    recommendations: buckets ?? { DREAM: [], TARGET: [], SAFE: [] },
    actions: [],
    next,
  };
}
