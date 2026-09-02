import { jsonResponse, requireAuth } from "../_utils.js";

// GET /api/products/:id — পাবলিক, একটি পণ্যের বিস্তারিত (ঐচ্ছিক ব্যবহার)
export async function onRequestGet({ params, env }) {
  if (!env.DB) return jsonResponse({ error: "D1 ডাটাবেজ বাইন্ড করা নেই (env.DB)।" }, 500);
  const row = await env.DB.prepare("SELECT * FROM products WHERE id = ?").bind(params.id).first();
  if (!row) return jsonResponse({ error: "not_found" }, 404);
  return jsonResponse({
    id: row.id,
    name: row.name,
    category: row.category,
    subcategory: row.subcategory,
    price: row.price,
    sale: row.sale,
    colors: JSON.parse(row.colors || "[]"),
    sizes: JSON.parse(row.sizes || "[]"),
    images: JSON.parse(row.images || "[]"),
    description: row.description,
    description_en: row.description_en,
    fabric: row.fabric,
    care: row.care,
  });
}

// DELETE /api/products/:id — শুধু লগ-ইন করা অ্যাডমিনের জন্য
export async function onRequestDelete({ params, request, env }) {
  if (!env.DB) return jsonResponse({ error: "D1 ডাটাবেজ বাইন্ড করা নেই (env.DB)।" }, 500);
  const authed = await requireAuth(request, env);
  if (!authed) return jsonResponse({ error: "unauthorized" }, 401);
  await env.DB.prepare("DELETE FROM products WHERE id = ?").bind(params.id).run();
  return jsonResponse({ ok: true });
}
