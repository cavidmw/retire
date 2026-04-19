# Blog Senkronizasyon Rehberi

## Sorun Ne İdi?

Admin panelde oluşturulan/düzenlenen/silinen bloglar public sitede anında güncellenmiyor veya eski silinen bloglar hâlâ görünüyordu.

## Kök Nedenler

### 1. Cache (Önbellek) Sorunu
- Blog detay sayfası (`/[blogId]`) **5 dakika** cache'leniyordu (`revalidate = 300`).
- Admin'den yapılan değişikliklerden sonra `revalidatePath` çağrılmıyordu.
- Public API yanıtlarında `Cache-Control` header yoktu, CDN/tarayıcı eski veriyi gösteriyordu.

### 2. Status (Durum) Filtresi Eksikti
- Blog detay sayfası (`/[blogId]/page.tsx`) **status filtresi olmadan** sorgu yapıyordu → draft ya da silindikten sonra tekrar eklenen yazılar da görünüyordu.
- Tek post API'si (`/api/posts/[id]`) da status filtresi yoktu.
- Sitemap'te tüm postlar (draft dahil) listeleniyordu.

### 3. Revalidation Yapılmıyordu
- Admin CRUD operasyonlarından (create/update/delete) sonra Next.js cache temizlenmiyordu.

## Yapılan Düzeltmeler

1. **`/api/admin/posts/route.ts`** → Her CRUD sonrası `revalidatePath('/')`, `revalidatePath('/{id}')` ve `revalidatePath('/sitemap.xml')` eklendi.
2. **`/api/posts/route.ts`** → `Cache-Control: no-store` header eklendi.
3. **`/api/posts/[id]/route.ts`** → `.eq('status', 'published')` filtresi eklendi.
4. **`/[blogId]/page.tsx`** → `status = published` filtresi + `revalidate = 0` (her zaman taze veri).
5. **`/sitemap.ts`** → `status = published` filtresi eklendi.
6. **`/api/revalidate/route.ts`** → Manuel cache temizleme endpoint'i oluşturuldu.
7. **`/api/admin/sync-check/route.ts`** → Admin panelden senkron durumunu kontrol eden debug endpoint'i oluşturuldu.

---

## Supabase'de Kontrol Edilmesi Gerekenler

### Adım 1: `posts` Tablosunu Kontrol Et
1. Supabase Dashboard → Table Editor → `posts` tablosuna git.
2. **`status`** sütununun var olduğunu doğrula. Her satırda `published` veya `draft` olmalı.
3. **Boş veya NULL olan `status`** satırları varsa → bunları `published` olarak güncelle.

### Adım 2: Eski `blogs` Tablosunu Kontrol Et
1. Table Editor'da `blogs` adlı bir tablo var mı bak.
2. **`blogs` tablosu boş veya kullanılmıyor olmalı** — tüm veriler `posts` tablosundan okunuyor.
3. Eğer `blogs` tablosunda eski veri varsa, artık kullanılmıyor. Silebilirsin veya bırakabilirsin.

### Adım 3: RLS (Row Level Security) Kontrol
1. Supabase → Authentication → Policies sayfasına git.
2. `posts` tablosunda **service_role** için `SELECT`, `INSERT`, `UPDATE`, `DELETE` izinlerinin açık olduğunu doğrula.
3. Eğer RLS açıksa ve uygun policy yoksa, API çalışmaz.

### Adım 4: Eski/Gereksiz Satırları Temizle
1. `posts` tablosunda admin panelde **görünmeyen** ama Supabase'de duran kayıtlar varsa sil.
2. Status'ü `published` olmayan ama yanlışlıkla kalmış kayıtları kontrol et.

---

## Debug: Senkron Kontrolü

Admin panele giriş yaptıktan sonra tarayıcıda şu URL'yi aç:

```
https://siteniz.vercel.app/api/admin/sync-check
```

Bu endpoint şunları gösterir:
- Toplam post sayısı
- Published/Draft ayrımı
- `blogs` tablosunun durumu
- Admin'de olup public'te olmayan yazılar
- Public'te olup admin'de olmayan yazılar (olmamalı)

---

## Acil Cache Temizleme

Eğer bir değişiklik hâlâ yansımıyorsa:

```bash
curl -X POST "https://siteniz.vercel.app/api/revalidate" \
  -H "Content-Type: application/json" \
  -d '{"path": "/"}'
```

Veya Vercel Dashboard → Deployments → en son deployment'a git → **Redeploy** butonuna bas.
