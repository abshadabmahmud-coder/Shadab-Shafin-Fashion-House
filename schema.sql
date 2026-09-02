-- শাদাব-শাফিন ফ্যাশন হাউস — Cloudflare D1 স্কিমা
-- চালানোর নিয়ম (README-এও আছে):
--   npx wrangler d1 execute <DATABASE_NAME> --remote --file=./schema.sql

CREATE TABLE IF NOT EXISTS products (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  category        TEXT NOT NULL DEFAULT '',
  subcategory     TEXT DEFAULT '',
  price           INTEGER NOT NULL DEFAULT 0,
  sale            INTEGER,
  colors          TEXT NOT NULL DEFAULT '[]',   -- JSON array: [{name, hex}]
  sizes           TEXT NOT NULL DEFAULT '[]',   -- JSON array: [{size, stock}]
  images          TEXT NOT NULL DEFAULT '[]',   -- JSON array of image URLs / data-URLs
  description     TEXT DEFAULT '',
  description_en  TEXT DEFAULT '',
  fabric          TEXT DEFAULT '',
  care            TEXT DEFAULT '',
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT
);

-- অ্যাডমিন লগ-ইন সেশন টোকেন (passcode যাচাইয়ের পর ইস্যু হয়)
CREATE TABLE IF NOT EXISTS sessions (
  token       TEXT PRIMARY KEY,
  created_at  INTEGER NOT NULL,
  expires_at  INTEGER NOT NULL
);

-- ডিফল্ট স্টোর সেটিংস (অ্যাডমিন প্যানেল থেকে পরে বদলানো যাবে)
INSERT OR IGNORE INTO settings (key, value) VALUES
  ('whatsappNumber', '8801715981918'),
  ('telegramNumber', '8801715981918'),
  ('email', 'abdullahalshadabmahmud@gmail.com'),
  ('currency', '৳'),
  ('freeDeliveryOver', '3000'),
  ('deliveryInsideDhaka', '80'),
  ('deliveryOutsideDhaka', '150');

-- ডিফল্ট ৬টি নমুনা পণ্য (চাইলে অ্যাডমিন প্যানেল থেকে এডিট/ডিলিট করুন)
INSERT OR IGNORE INTO products (id, name, category, subcategory, price, sale, colors, sizes, images, description, description_en, fabric, care, sort_order, created_at, updated_at) VALUES ('p1', 'Draped Silk Saree', 'Women', 'Saree', 6200, 4650, '[{"name": "Ink Black", "hex": "#14110F"}, {"name": "Champagne Gold", "hex": "#C9A24B"}]', '[{"size": "Free Size", "stock": 12}]', '["https://picsum.photos/seed/aora-p1-a/700/900", "https://picsum.photos/seed/aora-p1-b/700/900"]', 'একটি হাতে-তৈরি সিল্ক শাড়ি, নরম শ্যাম্পেইন-গোল্ড পাড় সহ।', 'A handcrafted silk saree with a soft champagne-gold border.', 'Pure Silk', 'Dry Clean Only', 0, 1735689600000, 1735689600000);
INSERT OR IGNORE INTO products (id, name, category, subcategory, price, sale, colors, sizes, images, description, description_en, fabric, care, sort_order, created_at, updated_at) VALUES ('p2', 'Structured Linen Panjabi', 'Men', 'Panjabi', 3400, NULL, '[{"name": "Ivory", "hex": "#F7F3EC"}, {"name": "Charcoal", "hex": "#2B2723"}]', '[{"size": "M", "stock": 8}, {"size": "L", "stock": 10}, {"size": "XL", "stock": 4}]', '["https://picsum.photos/seed/aora-p2-a/700/900", "https://picsum.photos/seed/aora-p2-b/700/900"]', 'প্রিমিয়াম লিনেন কাপড়ে তৈরি পাঞ্জাবি, আরামদায়ক ফিট।', 'A panjabi made from premium linen fabric with a comfortable fit.', 'Linen', 'Machine Wash Cold', 1, 1735689600000, 1735689600000);
INSERT OR IGNORE INTO products (id, name, category, subcategory, price, sale, colors, sizes, images, description, description_en, fabric, care, sort_order, created_at, updated_at) VALUES ('p3', 'Hand-Embroidered Kurti', 'Women', 'Kurti', 2450, 1960, '[{"name": "Rust Clay", "hex": "#8B4A2B"}, {"name": "Ivory", "hex": "#F7F3EC"}]', '[{"size": "S", "stock": 6}, {"size": "M", "stock": 9}, {"size": "L", "stock": 5}]', '["https://picsum.photos/seed/aora-p3-a/700/900", "https://picsum.photos/seed/aora-p3-b/700/900"]', 'হাতের কাজের এমব্রয়ডারি করা কুর্তি, রিল্যাক্সড ফিট।', 'A hand-embroidered kurti with a relaxed fit.', 'Cotton Blend', 'Hand Wash Recommended', 2, 1735689600000, 1735689600000);
INSERT OR IGNORE INTO products (id, name, category, subcategory, price, sale, colors, sizes, images, description, description_en, fabric, care, sort_order, created_at, updated_at) VALUES ('p4', 'Two-Piece Kids Occasion Set', 'Kids', 'Party Wear', 1900, NULL, '[{"name": "Champagne Gold", "hex": "#C9A24B"}]', '[{"size": "3-4Y", "stock": 5}, {"size": "5-6Y", "stock": 7}, {"size": "7-8Y", "stock": 3}]', '["https://picsum.photos/seed/aora-p4-a/700/900", "https://picsum.photos/seed/aora-p4-b/700/900"]', 'উৎসবের জন্য দুই-পিস সেট, নরম কাপড় ও আরামদায়ক ফিট।', 'A two-piece set for festive occasions, with soft fabric and a comfortable fit.', 'Cotton Silk', 'Dry Clean Only', 3, 1735689600000, 1735689600000);
INSERT OR IGNORE INTO products (id, name, category, subcategory, price, sale, colors, sizes, images, description, description_en, fabric, care, sort_order, created_at, updated_at) VALUES ('p5', 'Merino Wool Overcoat', 'Men', 'Jacket', 8900, 7100, '[{"name": "Ink Black", "hex": "#14110F"}, {"name": "Charcoal", "hex": "#2B2723"}]', '[{"size": "M", "stock": 3}, {"size": "L", "stock": 6}, {"size": "XL", "stock": 2}]', '["https://picsum.photos/seed/aora-p5-a/700/900", "https://picsum.photos/seed/aora-p5-b/700/900"]', 'মেরিনো উলে তৈরি ওভারকোট, শীতের জন্য উষ্ণ।', 'An overcoat made of merino wool, warm for winter.', 'Merino Wool', 'Dry Clean Only', 4, 1735689600000, 1735689600000);
INSERT OR IGNORE INTO products (id, name, category, subcategory, price, sale, colors, sizes, images, description, description_en, fabric, care, sort_order, created_at, updated_at) VALUES ('p6', 'Minimal Leather Belt', 'Accessories', 'Belt', 1200, 900, '[{"name": "Ink Black", "hex": "#14110F"}]', '[{"size": "One Size", "stock": 15}]', '["https://picsum.photos/seed/aora-p6-a/700/900", "https://picsum.photos/seed/aora-p6-b/700/900"]', 'খাঁটি চামড়ার তৈরি মিনিমাল বেল্ট।', 'A minimal belt made of genuine leather.', 'Genuine Leather', 'Wipe Clean', 5, 1735689600000, 1735689600000);
