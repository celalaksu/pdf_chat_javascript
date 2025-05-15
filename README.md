# PDF Chat - RAG Uygulaması

PDF dokümanlarınızla sohbet edebileceğiniz ve onlar hakkında sorular sorabileceğiniz bir Retrieval Augmented Generation (RAG) uygulaması. Bu uygulama, yüklediğiniz PDF dosyalarını işler, içeriklerini vektör veritabanına kaydeder ve Google'ın Gemini 2.0 Flash yapay zeka modelini kullanarak sorularınızı yanıtlar.

## Özellikler

- ✅ Çoklu PDF yükleme desteği
- ✅ PDF içeriklerini otomatik işleme
- ✅ Vektör veritabanına dönüştürme
- ✅ PDF içeriklerine dair sorulara akıllı yanıtlar
- ✅ Yüklenen PDF'lerin disk alanını korumak için otomatik silinme
- ✅ Kullanıcı dostu web arayüzü
- ✅ Google Gemini 2.0 Flash AI entegrasyonu

## Teknoloji Yığını

- **Backend**: Node.js, Express.js
- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Vector Embedding**: Google Gemini Embedding API
- **LLM**: Google Gemini 2.0 Flash
- **PDF İşleme**: Langchain PDF işleyicileri
- **Vektör Veritabanı**: In-memory vektör veritabanı

## Kurulum

### Ön Gereksinimler

- Node.js (14.x veya daha yeni)
- npm veya yarn
- Google AI API anahtarı

### Adımlar

1. Depoyu klonlayın:
   ```
   git clone <repo-url>
   cd pdf_chat_javascript
   ```

2. Gerekli paketleri yükleyin:
   ```
   npm install
   ```

3. `.env` dosyasını oluşturun ve Google API anahtarınızı ekleyin:
   ```
   GOOGLE_API_KEY="your_google_api_key_here"
   PORT=3000
   ```

4. Sunucuyu başlatın:
   ```
   npm start
   ```

5. Tarayıcıda uygulamayı açın:
   ```
   http://localhost:3000
   ```

## Kullanım

1. **PDF Yükleme**: "PDF Yükle" butonunu kullanarak bir veya birden fazla PDF dosyası yükleyin.

2. **Vektör Veritabanını Başlatma**: Yüklenen PDF dosyalarından vektör veritabanı oluşturmak için "Veritabanını Başlat" butonuna tıklayın.

3. **Soru Sorma**: PDF içerikleri hakkında sorular sormak için metin girişini kullanın. Örneğin, "Bu dokümanda X konusu hakkında ne anlatılıyor?" gibi.

4. **Yanıtları Alma**: Yapay zeka, PDF içeriklerine dayalı olarak sorularınızı yanıtlayacaktır.

## Teknik Detaylar

### PDF İşleme Süreci

1. PDF dosyaları `public/pdfs` dizinine yüklenir
2. LangChain PDF yükleyicisi ile dosyaların içeriği okunur
3. Her PDF sayfası ayrı bir belge olarak işlenir
4. Belgeler daha küçük parçalara bölünür (1000 karakter, 200 karakter örtüşme)
5. Google'ın Embedding API'si kullanılarak metin parçaları vektörlere dönüştürülür
6. Vektörler bellek içi veritabanında saklanır
7. PDF dosyaları işlendikten sonra otomatik olarak silinir

### RAG Süreçleri

1. Kullanıcı soru sorduğunda, soru metni vektör temsiline dönüştürülür
2. Vektör veritabanında en benzer doküman parçaları bulunur
3. İlgili içerikler ve kullanıcı sorusu bir prompt olarak formatlanır
4. Google Gemini 2.0 Flash modeli bu bilgilere dayanarak yanıt oluşturur
5. Yanıt kullanıcıya gösterilir

## Dosya Yapısı

```
pdf_chat_javascript/
│
├── public/               # Statik dosyalar
│   ├── css/             # CSS stilleri
│   ├── js/              # Frontend JavaScript kodu
│   ├── pdfs/            # Yüklenen PDF dosyalarının geçici olarak saklandığı yer
│   └── index.html       # Ana HTML sayfası
│
├── src/                  # Kaynak kodları
│   ├── utils/           # Yardımcı fonksiyonlar
│   │   ├── pdfLoader.js # PDF yükleme ve işleme
│   │   └── vectorStore.js # Vektör veritabanı yönetimi
│   │
│   ├── index.js         # Ana uygulama mantığı
│   └── server.js        # Express sunucusu ve API rotaları
│
├── .env                 # Ortam değişkenleri (API anahtarları)
├── .gitignore           # Git tarafından yok sayılacak dosyalar
├── package.json         # Proje bağımlılıkları ve betikleri
└── README.md            # Proje dokümantasyonu
```

## API Rotaları

- `GET /api/pdf-list` - Yüklenen PDF dosyalarını listeler
- `POST /api/upload-pdf` - PDF dosyalarını yükler
- `POST /api/initialize` - Vektör veritabanını başlatır
- `POST /api/ask` - Soru sorar ve yanıt alır

## Güvenlik Notları

- API anahtarları `.env` dosyasında saklanmalıdır ve bu dosya GitHub'a yüklenmemelidir.
- Bu uygulama yalnızca yerel geliştirme için tasarlanmıştır. Üretim ortamlarında ek güvenlik önlemleri alınmalıdır.
- Uygulamanın güvenli bir şekilde dağıtılabilmesi için HTTPS kullanılmalıdır.

## Katkılar

Katkıda bulunmak için lütfen bir issue açın veya pull request gönderin.

## Lisans

Bu proje ISC lisansı altında lisanslanmıştır.