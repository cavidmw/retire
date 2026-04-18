# Admin Panel — Tam Kurulum Rehberi

Bu rehber, admin panelinin eksiksiz çalışması için Supabase'de yapılması gereken tüm adımları Türkçe olarak, hiç teknik bilgi bilmiyormuşsunuz gibi anlatmaktadır.

---

## İletişim Formu Tablosu

### 1. Adım — Supabase'e girin

1. **https://supabase.com** adresine gidin ve hesabınıza giriş yapın.
2. Sol menüden projenizi seçin.

### 2. Adım — SQL Editor'ü açın

Sol menüde **"SQL Editor"** sekmesine tıklayın. Ortada büyük bir metin alanı göreceksiniz.

### 3. Adım — Contact Messages tablosunu oluşturun

Aşağıdaki kodu kopyalayıp SQL Editor'e yapıştırın ve **"Run"** butonuna tıklayın.

```sql
-- İletişim mesajları tablosu
CREATE TABLE IF NOT EXISTS contact_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL CHECK (char_length(name) <= 100),
  email       TEXT NOT NULL CHECK (char_length(email) <= 254),
  subject     TEXT NOT NULL CHECK (char_length(subject) <= 200),
  message     TEXT NOT NULL CHECK (char_length(message) <= 5000),
  ip_address  TEXT,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at
  ON contact_messages (created_at DESC);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access"
  ON contact_messages FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Anon can insert only"
  ON contact_messages FOR INSERT TO anon
  WITH CHECK (true);
```

> Başarılı olursa alt kısımda yeşil `"Success. No rows returned."` yazar.

---

## Blog Yazıları Tablosu — Status (Taslak/Yayında) Güncelleme

Eğer `posts` tablonuz zaten varsa, `status` sütununu eklemeniz gerekiyor.  
Eğer tablo henüz yoksa aşağıdaki tam oluşturma SQL'ini kullanın.

### Seçenek A — Tablo zaten var, sadece status sütunu ekle

```sql
-- Tabloya status kolonu ekle (eğer yoksa)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published'
  CHECK (status IN ('draft', 'published'));

-- updated_at kolonu da yoksa ekle
ALTER TABLE posts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Mevcut tüm yazıları "published" yap
UPDATE posts SET status = 'published' WHERE status IS NULL;

-- Index ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts (status);
CREATE INDEX IF NOT EXISTS idx_posts_updated_at ON posts (updated_at DESC);
```

### Seçenek B — Tablo hiç yok, sıfırdan oluştur

```sql
CREATE TABLE IF NOT EXISTS posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL DEFAULT '',
  summary         TEXT NOT NULL DEFAULT '',
  content_html    TEXT NOT NULL DEFAULT '',
  cover_image_url TEXT NOT NULL DEFAULT '',
  youtube_url     TEXT NOT NULL DEFAULT '',
  published_at    DATE NOT NULL DEFAULT CURRENT_DATE,
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_posts_status ON posts (status);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_updated_at ON posts (updated_at DESC);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Herkes yayımlananları okuyabilsin
CREATE POLICY "Public can read published"
  ON posts FOR SELECT TO anon
  USING (status = 'published');

-- Servis rolü her şeyi yönetebilsin
CREATE POLICY "Service role full access"
  ON posts FOR ALL TO service_role
  USING (true) WITH CHECK (true);
```

---

## Kurulum Tamam!

SQL'leri çalıştırdıktan sonra admin paneliniz tam olarak çalışır:

| Özellik | Açıklama |
|---|---|
| **Taslak sistemi** | Yazıyı "Taslak Kaydet" yaptığınızda sitede görünmez |
| **Yayımlama** | "Yayınla" butonuyla yazı siteye çıkar |
| **Otomatik kaydetme** | 5 saniye susunca veritabanına, 2 saniye susunca tarayıcıya kaydedilir |
| **Taslak kurtarma** | Tarayıcı kapansa bile kaldığınız yer korunur |
| **Çıkış uyarısı** | Kaydedilmemiş değişiklikle çıkmaya çalışınca uyarı verir |
| **Canlı önizleme** | "Önizle" butonuyla yan panelde gerçek görünüm |

---

## Güvenlik özeti

| Koruma | Açıklama |
|---|---|
| XSS / Script | Tüm veriler DOMPurify ile temizlenir; admin panelinde `innerHTML` sadece güvenli HTML için kullanılır |
| SQL Injection | Supabase client parametrik sorgular kullanır |
| Honeypot | İletişim formunda botlara karşı görünmez alanlar |
| Rate limit | IP başına dakikada 5 form gönderimi, 10 login denemesi |
| RLS | Veritabanı satır güvenliği devrede |
| Admin auth | Session cookie ile korunan API route'ları |
