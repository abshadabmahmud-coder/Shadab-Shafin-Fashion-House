import { jsonResponse, normalizePhone, hashPassword } from "../_utils.js";

const SESSION_DAYS = 30;

// POST /api/auth/register — পাবলিক। নতুন গ্রাহক অ্যাকাউন্ট তৈরি করে সাথে সাথে লগ-ইনও করিয়ে দেয়।
export async function onRequestPost({ request, env }) {
  if (!env.DB) return jsonResponse({ error: "D1 ডাটাবেজ বাইন্ড করা নেই (env.DB)।" }, 500);

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ error: "invalid_body" }, 400);
  }

  const name = String(body.name || "").trim();
  const phoneNorm = normalizePhone(body.phone || "");
  const password = String(body.password || "");
  const email = String(body.email || "").trim();

  if (!name) return jsonResponse({ error: "নাম আবশ্যক" }, 400);
  if (phoneNorm.length < 9) return jsonResponse({ error: "সঠিক মোবাইল নাম্বার দিন" }, 400);
  if (password.length < 6) return jsonResponse({ error: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে" }, 400);

  const existing = await env.DB.prepare("SELECT id FROM customers WHERE phone = ?").bind(phoneNorm).first();
  if (existing) return jsonResponse({ error: "এই মোবাইল নাম্বার দিয়ে আগে থেকেই অ্যাকাউন্ট আছে, লগ-ইন করুন" }, 409);

  const { hash, salt } = await hashPassword(password);
  const id = "cus_" + crypto.randomUUID();
  const now = Date.now();

  await env.DB.prepare(`
    INSERT INTO customers (id, phone, name, email, password_hash, password_salt, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(id, phoneNorm, name, email, hash, salt, now).run();

  const token = crypto.randomUUID() + crypto.randomUUID();
  const expiresAt = now + SESSION_DAYS * 24 * 60 * 60 * 1000;
  await env.DB.prepare(
    "INSERT INTO customer_sessions (token, customer_id, created_at, expires_at) VALUES (?, ?, ?, ?)"
  ).bind(token, id, now, expiresAt).run();

  return jsonResponse({ ok: true, token, customer: { name, phone: phoneNorm, email } });
}
