import { jsonResponse, requireCustomerAuth, orderRowToJSON } from "../_utils.js";

// GET /api/customer/orders — Authorization: Bearer <গ্রাহক টোকেন> আবশ্যক
// একই ফোন নাম্বারে করা সব অর্ডার দেখায় — গেস্ট হিসেবে অর্ডার করে পরে অ্যাকাউন্ট খুললেও পুরনো অর্ডার দেখা যাবে।
export async function onRequestGet({ request, env }) {
  if (!env.DB) return jsonResponse({ error: "D1 ডাটাবেজ বাইন্ড করা নেই (env.DB)।" }, 500);

  const customer = await requireCustomerAuth(request, env);
  if (!customer) return jsonResponse({ error: "unauthorized" }, 401);

  const { results } = await env.DB
    .prepare("SELECT * FROM orders WHERE customer_phone = ? ORDER BY created_at DESC")
    .bind(customer.phone)
    .all();

  return jsonResponse({
    customer: { name: customer.name, phone: customer.phone, email: customer.email },
    orders: (results || []).map(orderRowToJSON),
  });
}
