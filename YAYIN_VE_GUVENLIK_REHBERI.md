# Retire Townwise - Güvenlik & Yayın Rehberi

Bu rehber, projenin canlı ortama (Vercel) alınmadan önce yapılan kritik güvenlik iyileştirmelerini ve deploy sürecini adım adım anlatmaktadır.

## 🛡️ Yapılan Güvenlik İyileştirmeleri

Sitenizin yönetici paneli, API'leri ve formları ciddi bir güvenlik denetiminden geçirilerek şu açıklar kapatıldı:

1. **Yönetici Oturumu (Admin Session) Şifrelemesi:**
   * **Önceden:** Token sadece basit bir Base64 metniydi ve imza (signature) barındırmıyordu. Bu da teorik olarak session token'ın taklit edilebilmesine (spoofing) yol açıyordu.
   * **Şimdi:** Oturum token'ları **HMAC-SHA256** ile şifrelendi. `ADMIN_SESSION_SECRET` çevre değişkeni kullanılarak token'ın gerçekten sunucu tarafından üretildiği ve değiştirilmediği garanti altına alındı.
2. **Editör ve İçerik XSS Koruması:**
   * **Önceden:** Editörden gelen HTML metinleri olduğu gibi veritabanına yazılıyor ve siteye basılıyordu. Bu durum zararlı kod (XSS) enjeksiyonlarına müsaitti.
   * **Şimdi:** `sanitize-html` entegrasyonu sağlandı. Kaydedilen her içerik arka planda temizlenerek içerisine gizlenmiş zararlı `<script>` veya iframe etiketlerinden arındırıldı.
3. **Analitik Trafik ve Rate Limiting (Hız Sınırı):**
   * **Önceden:** İzleme (tracking) API'sine hız sınırı uygulanmıyordu, bu da kötü niyetli botların veritabanını şişirmesine olanak tanıyordu.
   * **Şimdi:** İletişim formunda olduğu gibi, analitik ölçüm endpoint'ine de saniyedeki istekleri kısıtlayan bir "Rate Limiter" eklendi. Aynı zamanda sayfa görüntülenmeleri için sadece son 30 dakikada yeni olan "Unique Visitor (Tekil Ziyaretçi)" kayıtları işlenecek şekilde dedublikasyon aktifleştirildi.

---

## 🚀 Vercel Deploy ve Güncelleme Adımları

Projeyi Vercel'de güvenli bir şekilde yayına almak veya mevcut sürümü güncellemek için şu adımları izleyin:

### 1. Çevre Değişkenlerini (Environment Variables) Ayarlama
Vercel projenize gidin -> **Settings** -> **Environment Variables** sekmesine tıklayın.
Şu ayarların Vercel'de doğru tanımlandığından emin olun:

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase projenizin ana URL'si
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon anahtarı
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase **Service Role** anahtarı (Kritik: Bunu asla `NEXT_PUBLIC_` olarak isimlendirmeyin, aksi takdirde dışarı sızar!)
- `ADMIN_PASSWORD`: Admin paneli giriş şifreniz (Güçlü bir şifre seçin)
- `ADMIN_SESSION_SECRET`: Oturumların şifrelenmesinde kullanılacak rastgele gizli anahtar (Örn: `retire-townwise-3a7b9c1d-secure-key`)
- `NEXT_PUBLIC_YOUTUBE_API_KEY`: YouTube entegrasyonu için (isteğe bağlı)
- `NEXT_PUBLIC_YOUTUBE_CHANNEL_ID`: YouTube entegrasyonu için (isteğe bağlı)

*Not: Vercel'e ekledikten sonra değişkenlerin etkili olması için projenizi yeniden deploy etmeniz gerekir.*

### 2. Github'a Push İşlemi
Yaptığınız son değişiklikleri GitHub deponuza gönderin:
```bash
git add .
git commit -m "Güvenlik iyileştirmeleri, Analitik tablosu ve İngilizce çeviriler tamamlandı"
git push origin main
```

### 3. Vercel'den Deploy İşlemini Tetikleme
- Eğer Vercel'de otomatik deploy açıksa, GitHub'a push attığınız anda yeni bir `Building` süreci başlar.
- Eğer otomatik deploy kapalıysa, Vercel panelinizden **Deployments** sekmesine girip son commit'inizin yanındaki üç noktadan **Redeploy** diyerek güncellemeyi alabilirsiniz.

---

## ✅ Yayına Geçmeden Önce Son Kontroller

Siteniz Vercel'de aktif olduktan sonra şu son kontrolleri yapmanızı tavsiye ederim:

1. **İletişim Formunu Deneyin:** Sitedeki iletişim formundan test mesajı yollayın ve Admin panelindeki "Mesajlar" sekmesine düşüp düşmediğine bakın.
2. **Admin Paneline Giriş Yapın:** `siteniz.com/admin` adresine gidip şifrenizle girdiğinizde, sayfayı yenilediğinizde sizi atmadığından (HMAC Session çalıştığından) emin olun.
3. **Analizler Sekmesini Açın:** Admin panelindeki yeni **Analizler** sekmesini açıp grafiğin ve görüntülenmelerin ekrana hatasız bir şekilde yansıdığını teyit edin.
4. **Yeni Bir Blog Yazısı Ekleyin/Düzenleyin:** Rastgele bir içerik oluşturup kaydedin. Kaydettikten sonra içerikteki formatlamanın (kalın yazı vb.) bozulmadan siteye yansıdığına bakın.

Her şey sorunsuz çalışıyorsa, sisteminiz güvenli ve canlı kullanıma hazırdır! Tebrikler! 🎉
