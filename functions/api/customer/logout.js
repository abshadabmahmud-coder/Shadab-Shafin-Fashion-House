import { jsonResponse } from "../_utils.js";

export async function onRequestPost({ request, env }) {
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (token && env.DB) {
    await env.DB.prepare("DELETE FROM customer_sessions WHERE token = ?").bind(token).run();
  }
  return jsonResponse({ ok: true });
}
