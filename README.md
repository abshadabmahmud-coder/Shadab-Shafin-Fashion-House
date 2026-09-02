# শাদাব-শাফিন ফ্যাশন হাউস — GitHub + Cloudflare Pages + D1 (ব্যাকএন্ডসহ)

এই ভার্সনে সাইটটা আর pure static/localStorage-নির্ভর না — এখন একটা আসল ব্যাকএন্ড আছে:

- **Frontend:** `index.html` (স্টোর) + `admin.html` (অ্যাডমিন প্যানেল) — Cloudflare Pages-এ হোস্ট হবে
- **Backend:** `functions/api/*.js` — Cloudflare Pages Functions (সার্ভারলেস, আলাদা সার্ভার লাগবে না)
- **Database:** Cloudflare **D1** (SQLite-based) — প্রোডাক্ট, স্টোর সেটিংস ও অ্যাডমিন সেশন এখানে জমা থাকবে

অ্যাডমিন প্যানেলে পণ্য যোগ/এডিট/ডিলিট করলে বা WhatsApp/Telegram/Email সেটিংস বদলালে সরাসরি D1-এ সেভ হবে
এবং **সাথে সাথে সব ভিজিটরের জন্য** লাইভ হয়ে যাবে — কোনো কোড কপি-পেস্ট বা রি-আপলোডের দরকার নেই।

## ফাইল স্ট্রাকচার

```
├── index.html                     ← স্টোরফ্রন্ট (হোমপেজ)
├── admin.html                     ← অ্যাডমিন প্যানেল
├── functions/
│   └── api/
│       ├── _utils.js              ← শেয়ার্ড হেল্পার (auth চেক) — নিজে থেকে কোনো URL হয় না
│       ├── products.js            ← GET /api/products (পাবলিক), POST /api/products (অ্যাডমিন)
│       ├── products/[id].js       ← DELETE /api/products/:id (অ্যাডমিন)
│       ├── settings.js            ← GET /api/settings (পাবলিক), PUT /api/settings (অ্যাডমিন)
│       └── admin/
│           ├── login.js           ← POST /api/admin/login
│           └── logout.js          ← POST /api/admin/logout
├── schema.sql                     ← D1 টেবিল + ডিফল্ট ডেটা
├── wrangler.toml                  ← (ঐচ্ছিক, শুধু লোকাল টেস্টের জন্য)
└── README.md
```

---

## ধাপ ১ — GitHub-এ কোড আপলোড

1. [github.com](https://github.com)-এ লগ-ইন করুন, **New repository** দিয়ে একটা রিপো বানান
   (যেমন নাম: `shadab-shafin-fashion-house`) — Public বা Private, দুটোই চলবে।
2. এই জিপের সবগুলো ফাইল/ফোল্ডার (`index.html`, `admin.html`, `functions/`, `schema.sql`,
   `wrangler.toml`, `.gitignore`, `README.md`) আপনার কম্পিউটারে এক ফোল্ডারে রাখুন।
3. টার্মিনাল/Git Bash খুলে সেই ফোল্ডারে গিয়ে:
   ```bash
   git init
   git add .
   git commit -m "Initial commit with Cloudflare D1 backend"
   git branch -M main
   git remote add origin https://github.com/<আপনার-ইউজারনেম>/shadab-shafin-fashion-house.git
   git push -u origin main
   ```
   (Git কমান্ড লাইনে স্বাচ্ছন্দ্য না থাকলে GitHub Desktop অ্যাপ দিয়েও একই কাজ drag & drop করে করা যায়।)

---

## ধাপ ২ — Cloudflare Pages-এ প্রজেক্ট কানেক্ট করা

1. [dash.cloudflare.com](https://dash.cloudflare.com) → বাম মেনু থেকে **Workers & Pages** → **Create** → **Pages** ট্যাব → **Connect to Git**
2. আপনার GitHub অ্যাকাউন্ট অথরাইজ করে উপরের রিপোটা সিলেক্ট করুন
3. Build সেটিংসে:
   - **Framework preset:** None
   - **Build command:** ফাঁকা রাখুন (খালি)
   - **Build output directory:** `/` (রুট ডিরেক্টরি)
4. **Save and Deploy** চাপুন। প্রথম ডিপ্লয় শেষ হলে `<প্রজেক্ট-নাম>.pages.dev` লিংকে সাইট চালু হয়ে যাবে
   (তবে এখনো D1 কানেক্ট করা হয়নি বলে সাইট ডিফল্ট নমুনা প্রোডাক্ট দেখাবে, অ্যাডমিন লগইন কাজ করবে না — এটাই স্বাভাবিক, পরের ধাপে ঠিক হয়ে যাবে)।

---

## ধাপ ৩ — D1 ডাটাবেজ তৈরি করা

**ড্যাশবোর্ড দিয়ে (সহজ পদ্ধতি):**

1. Cloudflare ড্যাশবোর্ডে **Workers & Pages** → **D1 SQL Database** → **Create database**
2. নাম দিন যেমন `shadab-shafin-db` → **Create**

**অথবা Wrangler CLI দিয়ে (যদি Node.js ইনস্টল থাকে):**
```bash
npm install -g wrangler
wrangler login
wrangler d1 create shadab-shafin-db
```
এই কমান্ড একটা `database_id` দেখাবে — সেটা `wrangler.toml` ফাইলের `<YOUR_DATABASE_ID>` জায়গায় বসিয়ে দিন (এটা শুধু লোকাল টেস্টের জন্য দরকার, Pages ড্যাশবোর্ড ডিপ্লয়ের জন্য দরকার নেই)।

---

## ধাপ ৪ — schema.sql চালিয়ে টেবিল বানানো

D1 ডাটাবেজ পেজে গিয়ে **Console** ট্যাবে `schema.sql` ফাইলের পুরো কনটেন্ট কপি-পেস্ট করে **Execute** চাপুন —
এতে `products`, `settings`, `sessions` টেবিল তৈরি হবে এবং ডিফল্ট ৬টি নমুনা প্রোডাক্ট + স্টোর সেটিংস বসে যাবে।

অথবা Wrangler CLI দিয়ে:
```bash
wrangler d1 execute shadab-shafin-db --remote --file=./schema.sql
```
(`--remote` বাদ দিলে এটা শুধু আপনার লোকাল কম্পিউটারে চলবে, আসল লাইভ ডাটাবেজে না — তাই deploy-এর জন্য `--remote` জরুরি।)

---

## ধাপ ৫ — D1 ডাটাবেজ Pages প্রজেক্টে বাইন্ড করা

1. আপনার Pages প্রজেক্টে যান → **Settings** → **Functions** → **D1 database bindings** → **Add binding**
2. **Variable name:** ঠিক `DB` লিখুন (বড় হাতের অক্ষরে — কোডে এই নামেই খোঁজা হয়)
3. **D1 database:** `shadab-shafin-db` সিলেক্ট করুন → **Save**

---

## ধাপ ৬ — অ্যাডমিন পাসকোড সেট করা

কোডের ভিতরে পাসকোড রাখা হয়নি — নিরাপত্তার জন্য এটা এনভায়রনমেন্ট ভ্যারিয়েবল হিসেবে রাখতে হবে:

1. Pages প্রজেক্টে **Settings** → **Environment variables** → **Add variable**
2. **Variable name:** `ADMIN_PASSCODE`
3. **Value:** আপনার পছন্দের একটা শক্ত পাসকোড (যেমন `Shadab@Shafin#2026Secure`)
4. এটাকে **Encrypt** (Secret) হিসেবে সেভ করুন যাতে ড্যাশবোর্ডেও কেউ প্লেইন টেক্সটে দেখতে না পারে
5. **Production** ও **Preview** — দুই এনভায়রনমেন্টেই যোগ করুন

---

## ধাপ ৭ — রিডিপ্লয় করা

D1 বাইন্ডিং বা এনভায়রনমেন্ট ভ্যারিয়েবল যোগ করার পর Cloudflare স্বয়ংক্রিয়ভাবে আগের ডিপ্লয়মেন্টে এটা যোগ করে না —
**Deployments** ট্যাবে গিয়ে সর্বশেষ ডিপ্লয়মেন্টের পাশে **⋯** মেনু থেকে **Retry deployment** চাপুন
(অথবা GitHub-এ একটা ছোট কমিট পুশ করলেও নতুন ডিপ্লয় ট্রিগার হবে)।

---

## ধাপ ৮ — টেস্ট করা

1. `আপনার-প্রজেক্ট.pages.dev` খুলুন — এখন এটা D1 থেকে প্রোডাক্ট লোড করে দেখাবে
2. `আপনার-প্রজেক্ট.pages.dev/admin.html` খুলুন → ধাপ ৬-এ দেওয়া পাসকোড দিয়ে লগ-ইন করুন
3. একটা নতুন প্রোডাক্ট যোগ করে সেভ করুন, তারপর অন্য ব্রাউজারে/ইনকগনিটোতে স্টোর পেজ খুলে দেখুন — সাথে সাথে দেখা যাবে
4. WhatsApp/Telegram/Email সেটিংস বদলে "সংরক্ষণ করুন" চাপুন — ফুটার ও ফ্লোটিং বাটনে সাথে সাথে আপডেট হয়ে যাবে

---

## কাস্টম ডোমেইন যোগ করা (ঐচ্ছিক)

Pages প্রজেক্টে **Custom domains** ট্যাব থেকে নিজের ডোমেইন (যেমন `shadabshafin.com`) যোগ করতে পারবেন —
ডোমেইনটা যদি ইতিমধ্যে Cloudflare-এ থাকে তাহলে এক ক্লিকেই হয়ে যাবে, বাইরের রেজিস্ট্রার হলে DNS রেকর্ড যোগ করার নির্দেশনা দেখাবে।

---

## সমস্যা সমাধান (Troubleshooting)

| সমস্যা | কারণ / সমাধান |
|---|---|
| স্টোরে শুধু ৬টা ডিফল্ট নমুনা প্রোডাক্ট দেখাচ্ছে, নতুন যোগ করা প্রোডাক্ট আসছে না | D1 বাইন্ডিং (ধাপ ৫) ঠিকমতো হয়নি অথবা রিডিপ্লয় (ধাপ ৭) করা হয়নি |
| অ্যাডমিন লগইনে "সার্ভারে সংযোগ করা যায়নি" | `ADMIN_PASSCODE` এনভায়রনমেন্ট ভ্যারিয়েবল সেট করা নেই, অথবা D1 বাইন্ডিং নেই |
| অ্যাডমিন লগইনে "ভুল পাসকোড" | ধাপ ৬-এ দেওয়া মানটাই সঠিকভাবে টাইপ করুন (কেস-সেনসিটিভ) |
| প্রোডাক্ট সেভ/ডিলিট করতে গেলে "সেশনের মেয়াদ শেষ" | সেশন ১২ ঘণ্টা পর এমনিতেই এক্সপায়ার হয় — আবার পাসকোড দিয়ে লগ-ইন করুন |
| ব্রাউজার কনসোলে API 500 এরর, `D1 ডাটাবেজ বাইন্ড করা নেই` মেসেজ | Settings → Functions-এ গিয়ে variable name ঠিক `DB` কিনা চেক করুন |

---

## নিরাপত্তা নোট

- `ADMIN_PASSCODE` কখনো কারো সাথে শেয়ার করবেন না; নিয়মিত বদলাতে চাইলে শুধু Environment variable-এর মান বদলে রিডিপ্লয় করলেই হবে
- অ্যাডমিন সেশন টোকেন ১২ ঘণ্টা পর এমনিতেই মেয়াদোত্তীর্ণ হয়ে যায় (`functions/api/admin/login.js`-এ `SESSION_HOURS` বদলে সময় কমানো/বাড়ানো যাবে)
- ছবি সরাসরি ফাইল থেকে আপলোড করলে সেটা কম্প্রেসড হয়ে ডাটাবেজে টেক্সট (data-URL) হিসেবে জমা হয় — অনেক বড় হাই-রেজোলিউশন ছবি বেশি হলে D1-এর স্টোরেজ লিমিটে চাপ পড়তে পারে; ভবিষ্যতে ছবির জন্য Cloudflare **R2** বা **Images** যোগ করার সুযোগ আছে (এই আপডেটে নেই, চাইলে পরে যোগ করে দিতে পারি)।
