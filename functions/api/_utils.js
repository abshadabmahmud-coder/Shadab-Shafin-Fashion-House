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

function bufToHex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// এলোমেলো hex সল্ট তৈরি করে
export function genSalt() {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return bufToHex(arr.buffer);
}

// পাসওয়ার্ড + সল্ট থেকে SHA-256 হ্যাশ তৈরি করে (plain text পাসওয়ার্ড কখনো DB-তে সেভ হয় না)
export async function hashPassword(password, salt) {
  const enc = new TextEncoder().encode(salt + ":" + password);
  const digest = await crypto.subtle.digest("SHA-256", enc);
  return bufToHex(digest);
}

// গ্রাহকের ফোন নাম্বার সাধারণ ফরম্যাটে নিয়ে আসে (স্পেস/ড্যাশ/দেশ কোড বাদ) যাতে একই নাম্বার সবসময় একইভাবে মেলে
export function normalizePhone(raw) {
  let p = String(raw || "").replace(/[^\d]/g, "");
  if (p.startsWith("880") && p.length === 13) p = p.slice(3);
  if (p.startsWith("0") && p.length === 11) p = p.slice(1);
  return p;
}

// Authorization: Bearer <token> হেডার চেক করে D1-এর customer_sessions টেবিলে বৈধ কিনা যাচাই করে (গ্রাহক)
// বৈধ হলে ফোন নাম্বার (string) রিটার্ন করে, না হলে false
export async function requireCustomerAuth(request, env) {
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return false;
  const now = Date.now();
  const row = await env.DB
    .prepare("SELECT phone FROM customer_sessions WHERE token = ? AND expires_at > ?")
    .bind(token, now)
    .first();
  return row ? row.phone : false;
}

// নতুন ইউনিক অর্ডার আইডি তৈরি করে (SSFH-XXXXXX ফরম্যাটে), ইতিমধ্যে ব্যবহৃত হলে আবার চেষ্টা করে
export async function genOrderId(env) {
  for (let i = 0; i < 5; i++) {
    const id = "SSFH-" + Math.floor(100000 + Math.random() * 899999);
    const existing = await env.DB.prepare("SELECT order_id FROM orders WHERE order_id = ?").bind(id).first();
    if (!existing) return id;
  }
  return "SSFH-" + Date.now();
}
