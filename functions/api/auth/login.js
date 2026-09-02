import { jsonResponse, normalizePhone, verifyPassword } from "../_utils.js";

const SESSION_DAYS = 30;

// POST /api/auth/login — পাবলিক। মোবাইল নাম্বার + পাসওয়ার্ড দিয়ে গ্রাহক লগ-ইন।
export async function onRequestPost({ request, env }) {
  if (!env.DB) return jsonResponse({ error: "D1 ডাটাবেজ বাইন্ড করা নেই (env.DB)।" }, 500);

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ error: "invalid_body" }, 400);
  }

  const phoneNorm = normalizePhone(body.phone || "");
  const password = String(body.password || "");

  const row = await env.DB.prepare("SELECT * FROM customers WHERE phone = ?").bind(phoneNorm).first();
  if (!row) return jsonResponse({ error: "এই নাম্বারে কোনো অ্যাকাউন্ট পাওয়া যায়নি" }, 401);

  const ok = await verifyPassword(password, row.password_salt, row.password_hash);
  if (!ok) return jsonResponse({ error: "ভুল পাসওয়ার্ড" }, 401);

  const token = crypto.randomUUID() + crypto.randomUUID();
  const now = Date.now();
  const expiresAt = now + SESSION_DAYS * 24 * 60 * 60 * 1000;

  await env.DB.prepare(
    "INSERT INTO customer_sessions (token, customer_id, created_at, expires_at) VALUES (?, ?, ?, ?)"
  ).bind(token, row.id, now, expiresAt).run();

  // পুরনো/মেয়াদোত্তীর্ণ সেশন পরিষ্কার
  await env.DB.prepare("DELETE FROM customer_sessions WHERE expires_at < ?").bind(now).run();

  return jsonResponse({ ok: true, token, customer: { name: row.name, phone: row.phone, email: row.email } });
}
