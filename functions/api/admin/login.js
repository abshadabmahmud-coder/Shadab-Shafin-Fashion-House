import { jsonResponse } from "../_utils.js";

const SESSION_HOURS = 12;

export async function onRequestPost({ request, env }) {
  if (!env.DB) {
    return jsonResponse({ error: "D1 ডাটাবেজ বাইন্ড করা নেই (env.DB)। README-এর D1 সেটআপ ধাপ অনুসরণ করুন।" }, 500);
  }
  if (!env.ADMIN_PASSCODE) {
    return jsonResponse({ error: "ADMIN_PASSCODE এনভায়রনমেন্ট ভ্যারিয়েবল সেট করা নেই।" }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ error: "invalid_body" }, 400);
  }

  const passcode = (body && body.passcode ? String(body.passcode) : "");
  if (passcode !== env.ADMIN_PASSCODE) {
    return jsonResponse({ error: "invalid_passcode" }, 401);
  }

  const token = crypto.randomUUID() + crypto.randomUUID();
  const now = Date.now();
  const expiresAt = now + SESSION_HOURS * 60 * 60 * 1000;

  await env.DB.prepare(
    "INSERT INTO sessions (token, created_at, expires_at) VALUES (?, ?, ?)"
  ).bind(token, now, expiresAt).run();

  // পুরনো/মেয়াদোত্তীর্ণ সেশন টুকিটাকি পরিষ্কার করে রাখুন
  await env.DB.prepare("DELETE FROM sessions WHERE expires_at < ?").bind(now).run();

  return jsonResponse({ token, expires_at: expiresAt });
}
