# 📊 Analiz Sistemi: Veritabanı Kurulum Rehberi

Admin panelindeki "Analizler" sekmesinin veri gösterebilmesi ve site trafiğinin düzgün çalışabilmesi için veritabanınızda (Supabase) izleme verilerinin kaydedileceği **`page_views`** isimli yeni bir tabloya ihtiyaç var. 

Aşağıdaki adımları sırasıyla, hiçbir şeyi atlamadan uygulayın. İşlem 1-2 dakika sürecektir.

---

### Adım 1: Supabase Paneline Giriş Yapın
1. Tarayıcınızdan **[Supabase](https://supabase.com/)**'e gidin ve projenize (`retire-townwise` veya ismini ne koyduysanız) giriş yapın.
2. Sol taraftaki menüden (siyah bar) **"SQL Editor"** simgesine (</> sembolü) tıklayın.
3. Çıkan ekranda **"New Query"** (Yeni Sorgu) butonuna basın.

### Adım 2: Gerekli SQL Kodunu Yapıştırın
Aşağıdaki SQL kodunun **tamamını kopyalayın** ve yeni açtığınız sorgu (query) ekranına yapıştırın:

```sql
-- SQL for Analytics
CREATE TABLE IF NOT EXISTS public.page_views (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  path text NOT NULL,
  visitor_hash text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Hızlı veri okuma için indexler
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON public.page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_visitor_path ON public.page_views(visitor_hash, path);

-- Güvenlik (RLS - Row Level Security) Ayarları
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage page_views" ON public.page_views;
CREATE POLICY "Service role can manage page_views"
ON public.page_views
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

### Adım 3: Kodu Çalıştırın
1. Ekranın sağ alt tarafında veya üstünde yer alan **"Run"** butonuna (veya klavyede CMD/CTRL + Enter) basın.
2. Sağ altta yeşil renkte **"Success"** (Başarılı) yazısını görmelisiniz.

### Adım 4: Başarılı Olduğunu Kontrol Edin
1. Sol menüden **"Table Editor"** (Tablo Editörü - ızgara simgesi) bölümüne tıklayın.
2. Soldaki tablolar listesinde **`page_views`** adında yeni bir tablonun göründüğünden emin olun. Bu tablo şu an boş olmalıdır.

---

## 🎯 Test Aşaması (Sistem Çalışıyor Mu?)

Veritabanını hazırladıktan sonra sistemin çalışıp çalışmadığını test etmek için şu adımları uygulayın:

1. Kendi websitenize (`localhost` ya da Vercel'deki canlı siteniz) gidin.
2. **Anasayfada biraz dolaşın**, ardından **herhangi bir blog yazınızın içine tıklayıp okuyun**.
3. Ardından hemen `Siteniz.com/admin` paneline giriş yapın.
4. **"Analizler"** sekmesine tıklayın.
5. Grafikte **"Toplam Görüntülenme: 2"** ve **"Tekil Ziyaretçi: 1"** (veya benzeri, girdiğiniz sayfalara göre) görmelisiniz. Ayrıca "En Çok Okunan Yazılar" bölümünde de biraz önce tıkladığınız yazının adı çıkmalıdır.

> **💡 Önemli Not:** "Aynı kişi arka arkaya F5 atarsa saymasın" kuralı gereği, aynı sayfayı (örneğin aynı blog yazısını) defalarca yenilerseniz sayım artmayacaktır. Test ederken farklı sayfalara (anasayfaya, farklı blog yazılarına) tıklayarak test edebilirsiniz. Yeni bir tekil ziyaretçi gibi görünmek isterseniz tarayıcınızı *Gizli Sekme* (Incognito) olarak açıp siteye tekrar girmeyi deneyebilirsiniz.
