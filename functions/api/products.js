import { jsonResponse, requireAuth } from "./_utils.js";

function rowToProduct(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    subcategory: row.subcategory,
    price: row.price,
    sale: row.sale,
    colors: safeParse(row.colors, []),
    sizes: safeParse(row.sizes, []),
    images: safeParse(row.images, []),
    description: row.description,
    description_en: row.description_en,
    fabric: row.fabric,
    care: row.care,
  };
}

function safeParse(str, fallback) {
  try {
    return str ? JSON.parse(str) : fallback;
  } catch (e) {
    return fallback;
  }
}

// GET /api/products — পাবলিক, সবার জন্য প্রোডাক্ট লিস্ট
export async function onRequestGet({ env }) {
  if (!env.DB) return jsonResponse({ error: "D1 ডাটাবেজ বাইন্ড করা নেই (env.DB)।" }, 500);
  const { results } = await env.DB
    .prepare("SELECT * FROM products ORDER BY sort_order ASC, created_at ASC")
    .all();
  return jsonResponse((results || []).map(rowToProduct));
}

// POST /api/products — শুধু লগ-ইন করা অ্যাডমিনের জন্য; নতুন প্রোডাক্ট তৈরি অথবা id মিললে আপডেট (upsert)
export async function onRequestPost({ request, env }) {
  if (!env.DB) return jsonResponse({ error: "D1 ডাটাবেজ বাইন্ড করা নেই (env.DB)।" }, 500);
  const authed = await requireAuth(request, env);
  if (!authed) return jsonResponse({ error: "unauthorized" }, 401);

  let p;
  try {
    p = await request.json();
  } catch (e) {
    return jsonResponse({ error: "invalid_body" }, 400);
  }
  if (!p.name || !p.price) {
    return jsonResponse({ error: "পণ্যের নাম ও দাম আবশ্যক" }, 400);
  }

  const id = p.id ? String(p.id) : "p" + Date.now();
  const now = Date.now();

  // ON CONFLICT-এ শুধু SET-এ উল্লেখ করা কলামগুলোই বদলায় — created_at ও sort_order পুরনো মানই থেকে যায়
  await env.DB.prepare(`
    INSERT INTO products
      (id, name, category, subcategory, price, sale, colors, sizes, images, description, description_en, fabric, care, sort_order, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name, category=excluded.category, subcategory=excluded.subcategory,
      price=excluded.price, sale=excluded.sale, colors=excluded.colors, sizes=excluded.sizes,
      images=excluded.images, description=excluded.description, description_en=excluded.description_en,
      fabric=excluded.fabric, care=excluded.care, updated_at=excluded.updated_at
  `).bind(
    id,
    p.name,
    p.category || "",
    p.subcategory || "",
    Number(p.price) || 0,
    p.sale ? Number(p.sale) : null,
    JSON.stringify(p.colors || []),
    JSON.stringify(p.sizes || []),
    JSON.stringify(p.images || []),
    p.description || "",
    p.description_en || "",
    p.fabric || "",
    p.care || "",
    now,
    now
  ).run();

  return jsonResponse({ ok: true, id });
}
