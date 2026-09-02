import { jsonResponse, requireCustomerAuth } from "../_utils.js";

export async function onRequestGet({ request, env }) {
  if (!env.DB) return jsonResponse({ error: "D1 ডাটাবেজ বাইন্ড করা নেই।" }, 500);

  const phone = await requireCustomerAuth(request, env);
  if (!phone) return jsonResponse({ error: "unauthorized" }, 401);

  const customer = await env.DB.prepare("SELECT phone, name FROM customers WHERE phone = ?").bind(phone).first();
  if (!customer) return jsonResponse({ error: "not_found" }, 404);

  return jsonResponse(customer);
}
