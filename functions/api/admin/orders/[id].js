import { jsonResponse, requireAuth } from "../../_utils.js";

const VALID_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

// PATCH /api/admin/orders/:id — শুধু অ্যাডমিনের জন্য; অর্ডারের স্ট্যাটাস বদলায় (গ্রাহকের ট্র্যাকিংয়ে সাথে সাথে দেখাবে)
export async function onRequestPatch({ params, request, env }) {
  if (!env.DB) return jsonResponse({ error: "D1 ডাটাবেজ বাইন্ড করা নেই (env.DB)।" }, 500);
  const authed = await requireAuth(request, env);
  if (!authed) return jsonResponse({ error: "unauthorized" }, 401);

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ error: "invalid_body" }, 400);
  }

  const status = String(body.status || "");
  if (!VALID_STATUSES.includes(status)) {
    return jsonResponse({ error: "অবৈধ স্ট্যাটাস" }, 400);
  }

  const now = Date.now();
  const result = await env.DB
    .prepare("UPDATE orders SET status = ?, updated_at = ? WHERE id = ?")
    .bind(status, now, params.id)
    .run();

  if (!result.meta || result.meta.changes === 0) {
    return jsonResponse({ error: "not_found" }, 404);
  }

  return jsonResponse({ ok: true });
}
