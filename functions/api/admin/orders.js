import { jsonResponse, requireAuth, orderRowToJSON } from "../_utils.js";

// GET /api/admin/orders — শুধু লগ-ইন করা অ্যাডমিনের জন্য; সব অর্ডার (নতুন আগে)
export async function onRequestGet({ request, env }) {
  if (!env.DB) return jsonResponse({ error: "D1 ডাটাবেজ বাইন্ড করা নেই (env.DB)।" }, 500);
  const authed = await requireAuth(request, env);
  if (!authed) return jsonResponse({ error: "unauthorized" }, 401);

  const { results } = await env.DB
    .prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT 500")
    .all();

  return jsonResponse((results || []).map(orderRowToJSON));
}
