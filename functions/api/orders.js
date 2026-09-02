import { jsonResponse, requireCustomerAuth, normalizePhone, genOrderId } from "./_utils.js";

// POST /api/orders — পাবলিক (গেস্ট চেকআউট চলবে)। Authorization হেডারে বৈধ গ্রাহক টোকেন থাকলে
// অর্ডারটি সেই অ্যাকাউন্টের সাথে যুক্ত হয়ে যাবে, যাতে পরে "আমার অর্ডার" পেজে দেখা যায়।
export async function onRequestPost({ request, env }) {
  if (!env.DB) return jsonResponse({ error: "D1 ডাটাবেজ বাইন্ড করা নেই (env.DB)।" }, 500);

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ error: "invalid_body" }, 400);
  }

  const name = String(body.name || "").trim();
  const phoneDisplay = String(body.phone || "").trim();
  const address = String(body.address || "").trim();
  const items = Array.isArray(body.items) ? body.items : [];

  if (!name || !phoneDisplay || !address || items.length === 0) {
    return jsonResponse({ error: "নাম, মোবাইল নাম্বার, ঠিকানা ও অন্তত একটি পণ্য আবশ্যক" }, 400);
  }

  const phoneNorm = normalizePhone(phoneDisplay);
  if (phoneNorm.length < 9) {
    return jsonResponse({ error: "সঠিক মোবাইল নাম্বার দিন" }, 400);
  }

  // লগ-ইন করা গ্রাহক হলে সেশন যাচাই করে অর্ডারের সাথে সংযুক্ত করা (ঐচ্ছিক — গেস্টও অর্ডার করতে পারবে)
  let customer = null;
  if (request.headers.get("Authorization")) {
    customer = await requireCustomerAuth(request, env);
  }

  const subtotal = Number(body.subtotal) || 0;
  const delivery = Number(body.delivery) || 0;
  const total = Number(body.total) || subtotal + delivery;
  const now = Date.now();

  // ইউনিক ট্র্যাকিং আইডি তৈরি (কালেভদ্রে সংঘর্ষ হলে আবার চেষ্টা করবে)
  let id;
  let attempts = 0;
  while (true) {
    id = genOrderId();
    const exists = await env.DB.prepare("SELECT id FROM orders WHERE id = ?").bind(id).first();
    if (!exists) break;
    attempts++;
    if (attempts > 8) return jsonResponse({ error: "অর্ডার আইডি তৈরি করা যায়নি, আবার চেষ্টা করুন" }, 500);
  }

  await env.DB.prepare(`
    INSERT INTO orders
      (id, customer_id, customer_phone, name, phone_display, email, district, area, address, note, payment_method, items, subtotal, delivery, total, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
  `).bind(
    id,
    customer ? customer.id : null,
    phoneNorm,
    name,
    phoneDisplay,
    String(body.email || "").trim(),
    String(body.district || "").trim(),
    String(body.area || "").trim(),
    address,
    String(body.note || "").trim(),
    String(body.payment || "cod"),
    JSON.stringify(items),
    subtotal,
    delivery,
    total,
    now,
    now
  ).run();

  return jsonResponse({ ok: true, orderId: id, status: "pending" });
}
