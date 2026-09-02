import { jsonResponse, hashPassword, normalizePhone } from "../_utils.js";

const SESSION_DAYS = 30;

export async function onRequestPost({ request, env }) {
  if (!env.DB) {
    return jsonResponse({ error: "D1 ডাটাবেজ বাইন্ড করা নেই (env.DB)।" }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ error: "invalid_body" }, 400);
  }

  const phone = normalizePhone(body && body.phone);
  const password = (body && body.password ? String(body.password) : "");

  const customer = await env.DB.prepare(
    "SELECT phone, name, password_hash, salt FROM customers WHERE phone = ?"
  ).bind(phone).first();

  if (!customer) {
    return jsonResponse({ error: "এই নাম্বারে কোনো অ্যাকাউন্ট পাওয়া যায়নি।" }, 401);
  }

  const attemptHash = await hashPassword(password, customer.salt);
  if (attemptHash !== customer.password_hash) {
    return jsonResponse({ error: "ভুল পাসওয়ার্ড।" }, 401);
  }

  const now = Date.now();
  const token = crypto.randomUUID() + crypto.randomUUID();
  const expiresAt = now + SESSION_DAYS * 24 * 60 * 60 * 1000;
  await env.DB.prepare(
    "INSERT INTO customer_sessions (token, phone, created_at, expires_at) VALUES (?, ?, ?, ?)"
  ).bind(token, phone, now, expiresAt).run();

  await env.DB.prepare("DELETE FROM customer_sessions WHERE expires_at < ?").bind(now).run();

  return jsonResponse({ token, phone: customer.phone, name: customer.name, expires_at: expiresAt });
}
