import { jsonResponse, requireAuth } from "./_utils.js";

const ALLOWED_KEYS = [
  "whatsappNumber",
  "telegramNumber",
  "email",
  "currency",
  "freeDeliveryOver",
  "deliveryInsideDhaka",
  "deliveryOutsideDhaka",
];

// GET /api/settings — পাবলিক, স্টোরফ্রন্টের জন্য দরকার
export async function onRequestGet({ env }) {
  if (!env.DB) return jsonResponse({ error: "D1 ডাটাবেজ বাইন্ড করা নেই (env.DB)।" }, 500);
  const { results } = await env.DB.prepare("SELECT key, value FROM settings").all();
  const settings = {};
  for (const r of results || []) settings[r.key] = r.value;
  return jsonResponse(settings);
}

// PUT /api/settings — শুধু লগ-ইন করা অ্যাডমিনের জন্য
export async function onRequestPut({ request, env }) {
  if (!env.DB) return jsonResponse({ error: "D1 ডাটাবেজ বাইন্ড করা নেই (env.DB)।" }, 500);
  const authed = await requireAuth(request, env);
  if (!authed) return jsonResponse({ error: "unauthorized" }, 401);

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ error: "invalid_body" }, 400);
  }

  const stmts = [];
  for (const key of ALLOWED_KEYS) {
    if (body[key] !== undefined && body[key] !== null) {
      stmts.push(
        env.DB.prepare(
          "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
        ).bind(key, String(body[key]))
      );
    }
  }
  if (stmts.length) await env.DB.batch(stmts);

  return jsonResponse({ ok: true });
}
