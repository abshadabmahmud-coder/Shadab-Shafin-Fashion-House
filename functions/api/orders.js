import { jsonResponse, normalizePhone, genOrderId } from "./_utils.js";

export async function onRequestPost({ request, env }) {
  if (!env.DB) {
    return jsonResponse({ error: "D1 ডাটাবেজ বাইন্ড করা নেই (env.DB)। README-এর D1 সেটআপ ধাপ অনুসরণ করুন।" }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ error: "invalid_body" }, 400);
  }

  const name = (body.name ? String(body.name).trim() : "");
  const phone = normalizePhone(body.phone);
  const address = (body.address ? String(body.address).trim() : "");
  const items = Array.isArray(body.items) ? body.items : [];

  if (!name || phone.length !== 11 || !address || items.length === 0) {
    return jsonResponse({ error: "নাম, সঠিক মোবাইল নাম্বার, ঠিকানা ও অন্তত একটি পণ্য আবশ্যক।" }, 400);
  }

  const subtotal = Number(body.subtotal) || 0;
  const delivery = Number(body.delivery) || 0;
  const total = Number(body.total) || (subtotal + delivery);

  const orderId = await genOrderId(env);
  const now = Date.now();

  await env.DB.prepare(
    `INSERT INTO orders (order_id, phone, customer_name, email, district, area, address, note, payment, items, subtotal, delivery, total, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?)`
  ).bind(
    orderId,
    phone,
    name,
    (body.email ? String(body.email).trim() : ""),
    (body.district ? String(body.district).trim() : ""),
    (body.area ? String(body.area).trim() : ""),
    address,
    (body.note ? String(body.note).trim() : ""),
    (body.payment ? String(body.payment).trim() : "cod"),
    JSON.stringify(items),
    subtotal,
    delivery,
    total,
    now,
    now
  ).run();

  return jsonResponse({ order_id: orderId, phone, status: "Pending" });
}
