import { jsonResponse, genSalt, hashPassword, normalizePhone } from "../_utils.js";

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
  const name = (body && body.name ? String(body.name).trim() : "");
  const password = (body && body.password ? String(body.password) : "");

  if (phone.length !== 11) {
    return jsonResponse({ error: "সঠিক ১১ ডিজিটের মোবাইল নাম্বার দিন।" }, 400);
  }
  if (!name) {
    return jsonResponse({ error: "নাম দিন।" }, 400);
  }
  if (password.length < 6) {
    return jsonResponse({ error: "পাসওয়ার্ড কমপক্ষে ৬ ক্যারেক্টার হতে হবে।" }, 400);
  }

  const existing = await env.DB.prepare("SELECT phone FROM customers WHERE phone = ?").bind(phone).first();
  if (existing) {
    return jsonResponse({ error: "এই নাম্বারে ইতিমধ্যে অ্যাকাউন্ট আছে। লগইন করুন।" }, 409);
  }

  const salt = genSalt();
  const passwordHash = await hashPassword(password, salt);
  const now = Date.now();

  await env.DB.prepare(
    "INSERT INTO customers (phone, name, password_hash, salt, created_at) VALUES (?, ?, ?, ?, ?)"
  ).bind(phone, name, passwordHash, salt, now).run();

  const token = crypto.randomUUID() + crypto.randomUUID();
  const expiresAt = now + SESSION_DAYS * 24 * 60 * 60 * 1000;
  await env.DB.prepare(
    "INSERT INTO customer_sessions (token, phone, created_at, expires_at) VALUES (?, ?, ?, ?)"
  ).bind(token, phone, now, expiresAt).run();

  return jsonResponse({ token, phone, name, expires_at: expiresAt });
}
