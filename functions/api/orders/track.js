import { jsonResponse } from "../_utils.js";

export async function onRequestGet({ request, env }) {
  if (!env.DB) return jsonResponse({ error: "D1 ডাটাবেজ বাইন্ড করা নেই।" }, 500);

  const url = new URL(request.url);
  const orderId = (url.searchParams.get("order_id") || "").trim();

  if (!orderId) {
    return jsonResponse({ error: "অর্ডার আইডি দিন।" }, 400);
  }

  const order = await env.DB.prepare(
    "SELECT order_id, customer_name, phone, district, area, address, payment, items, subtotal, delivery, total, status, created_at, updated_at FROM orders WHERE order_id = ?"
  ).bind(orderId).first();

  if (!order) {
    return jsonResponse({ error: "এই অর্ডার আইডি দিয়ে কোনো অর্ডার পাওয়া যায়নি।" }, 404);
  }

  order.items = JSON.parse(order.items || "[]");
  return jsonResponse(order);
}

