import { jsonResponse, requireAuth } from "../_utils.js";

const VALID_STATUSES = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

export async function onRequestGet({ request, env }) {
  if (!env.DB) return jsonResponse({ error: "D1 ডাটাবেজ বাইন্ড করা নেই।" }, 500);

  const ok = await requireAuth(request, env);
  if (!ok) return jsonResponse({ error: "unauthorized" }, 401);

  const { results } = await env.DB.prepare(
    "SELECT order_id, phone, customer_name, email, district, area, address, note, payment, items, subtotal, delivery, total, status, created_at, updated_at FROM orders ORDER BY created_at DESC"
  ).all();

  const orders = (results || []).map((o) => ({ ...o, items: JSON.parse(o.items || "[]") }));
  return jsonResponse(orders);
}

export async function onRequestPut({ request, env }) {
  if (!env.DB) return jsonResponse({ error: "D1 ডাটাবেজ বাইন্ড করা নেই।" }, 500);

  const ok = await requireAuth(request, env);
  if (!ok) return jsonResponse({ error: "unauthorized" }, 401);

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ error: "invalid_body" }, 400);
  }

  const orderId = (body && body.order_id ? String(body.order_id).trim() : "");
  const status = (body && body.status ? String(body.status).trim() : "");

  if (!orderId || !VALID_STATUSES.includes(status)) {
    return jsonResponse({ error: "সঠিক order_id ও status দিন (Pending/Processing/Shipped/Delivered/Cancelled)।" }, 400);
  }

  const existing = await env.DB.prepare("SELECT order_id FROM orders WHERE order_id = ?").bind(orderId).first();
  if (!existing) return jsonResponse({ error: "এই অর্ডার আইডি পাওয়া যায়নি।" }, 404);

  await env.DB.prepare("UPDATE orders SET status = ?, updated_at = ? WHERE order_id = ?")
    .bind(status, Date.now(), orderId)
    .run();

  return jsonResponse({ ok: true, order_id: orderId, status });
}
