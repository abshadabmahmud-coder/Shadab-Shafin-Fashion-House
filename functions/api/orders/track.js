import { jsonResponse, normalizePhone, orderRowToJSON } from "../_utils.js";

// GET /api/orders/track?id=SSFH-XXXXX&phone=01XXXXXXXXX
// পাবলিক এন্ডপয়েন্ট, কিন্তু প্রাইভেসির জন্য অর্ডার আইডি + অর্ডারে দেওয়া মোবাইল নাম্বার দুটোই মিলতে হবে।
export async function onRequestGet({ request, env }) {
  if (!env.DB) return jsonResponse({ error: "D1 ডাটাবেজ বাইন্ড করা নেই (env.DB)।" }, 500);

  const url = new URL(request.url);
  const id = String(url.searchParams.get("id") || "").trim().toUpperCase();
  const phoneNorm = normalizePhone(url.searchParams.get("phone") || "");

  if (!id || !phoneNorm) {
    return jsonResponse({ error: "অর্ডার আইডি ও মোবাইল নাম্বার দিন" }, 400);
  }

  const row = await env.DB.prepare("SELECT * FROM orders WHERE id = ?").bind(id).first();
  if (!row || row.customer_phone !== phoneNorm) {
    return jsonResponse({ error: "not_found" }, 404);
  }

  return jsonResponse(orderRowToJSON(row));
}
