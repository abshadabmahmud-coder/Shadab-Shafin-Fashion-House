import { jsonResponse } from "../_utils.js";

// POST /api/auth/logout — Authorization: Bearer <token> পাঠালে সেই সেশন মুছে ফেলা হয়
export async function onRequestPost({ request, env }) {
  if (!env.DB) return jsonResponse({ error: "D1 ডাটাবেজ বাইন্ড করা নেই (env.DB)।" }, 500);
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (token) {
    await env.DB.prepare("DELETE FROM customer_sessions WHERE token = ?").bind(token).run();
  }
  return jsonResponse({ ok: true });
}
