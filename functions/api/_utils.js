// এই ফাইলটি "_" দিয়ে শুরু বলে Cloudflare Pages এটাকে আলাদা রুট হিসেবে ধরবে না —
// শুধু অন্য functions/api/*.js ফাইল থেকে import করে ব্যবহার করার জন্য শেয়ার্ড হেল্পার।

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

// Authorization: Bearer <token> হেডার চেক করে D1-এর sessions টেবিলে বৈধ কিনা যাচাই করে (অ্যাডমিন)
export async function requireAuth(request, env) {
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return false;
  const now = Date.now();
  const row = await env.DB
    .prepare("SELECT token FROM sessions WHERE token = ? AND expires_at > ?")
    .bind(token, now)
    .first();
  return !!row;
}

// Authorization: Bearer <token> হেডার চেক করে D1-এর customer_sessions টেবিলে বৈধ কিনা যাচাই করে (গ্রাহক)
// বৈধ হলে { id, name, phone, email } রিটার্ন করে, না হলে null
export async function requireCustomerAuth(request, env) {
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  const now = Date.now();
  const row = await env.DB
    .prepare(`
      SELECT c.id, c.name, c.phone, c.email
      FROM customer_sessions s
      JOIN customers c ON c.id = s.customer_id
      WHERE s.token = ? AND s.expires_at > ?
    `)
    .bind(token, now)
    .first();
  return row || null;
}

// ফোন নাম্বার normalize করে — দেশ কোড (880) ও শুরুর 0 বাদ দিয়ে মূল নাম্বারে রূপান্তর করে,
// যাতে গ্রাহক "01715981918", "8801715981918", "+8801715981918" যেভাবেই লিখুন না কেন সব একইভাবে ম্যাচ হয়
export function normalizePhone(phone) {
  let p = String(phone || "").replace(/[^\d]/g, "");
  if (p.startsWith("880")) p = p.slice(3);
  if (p.startsWith("0")) p = p.slice(1);
  return p;
}

// নতুন ইউনিক অর্ডার ট্র্যাকিং আইডি জেনারেট করে, যেমন SSFH-48213
export function genOrderId() {
  return "SSFH-" + Math.floor(10000 + Math.random() * 89999);
}

// D1 row → পাবলিক অর্ডার JSON (ট্র্যাকিং, অর্ডার হিস্টরি, অ্যাডমিন প্যানেল — সব জায়গায় একই শেপ ব্যবহার হয়)
export function orderRowToJSON(row) {
  return {
    id: row.id,
    status: row.status,
    name: row.name,
    phone: row.phone_display,
    email: row.email,
    district: row.district,
    area: row.area,
    address: row.address,
    note: row.note,
    payment_method: row.payment_method,
    items: safeParseJSON(row.items, []),
    subtotal: row.subtotal,
    delivery: row.delivery,
    total: row.total,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function safeParseJSON(str, fallback) {
  try {
    return str ? JSON.parse(str) : fallback;
  } catch (e) {
    return fallback;
  }
}

// পাসওয়ার্ড হ্যাশ করে (PBKDF2 + random salt) — কখনো প্লেইন টেক্সট পাসওয়ার্ড D1-এ সেভ হয় না
export async function hashPassword(password, existingSaltHex) {
  const enc = new TextEncoder();
  const salt = existingSaltHex ? hexToBytes(existingSaltHex) : crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return { hash: bytesToHex(new Uint8Array(bits)), salt: bytesToHex(salt) };
}

export async function verifyPassword(password, saltHex, hashHex) {
  const { hash } = await hashPassword(password, saltHex);
  return hash === hashHex;
}

function bytesToHex(bytes) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function hexToBytes(hex) {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < arr.length; i++) arr[i] = parseInt(hex.substr(i * 2, 2), 16);
  return arr;
}
