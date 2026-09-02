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

// Authorization: Bearer <token> হেডার চেক করে D1-এর sessions টেবিলে বৈধ কিনা যাচাই করে
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
