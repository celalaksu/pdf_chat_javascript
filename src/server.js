const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { initializeVectorStore, answerQuestion } = require('./index');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware ayarları
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Vercel için özelleştirilmiş PDF yükleme yapılandırması
const isVercel = process.env.VERCEL === '1';

// PDF dosyaları için upload ayarları
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Klasörün varlığını kontrol et, yoksa oluştur
    const uploadDir = path.join(__dirname, '../public/pdfs');
    if (!fs.existsSync(uploadDir)) {
      try {
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log('PDF klasörü oluşturuldu:', uploadDir);
      } catch (error) {
        console.error('PDF klasörü oluşturulurken hata:', error);
      }
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Yalnızca PDF dosyaları yüklenebilir!'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB sınırı
  }
});

// Ana sayfa
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// API endpoint'lerini error handling ile sarmalayalım
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// PDF dosyalarını listele
app.get('/api/pdf-list', asyncHandler(async (req, res) => {
  const pdfDir = path.join(__dirname, '../public/pdfs');
  
  // Klasör yoksa oluştur
  if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir, { recursive: true });
  }
  
  const files = await fs.promises.readdir(pdfDir);
  const pdfFiles = files.filter(file => file.endsWith('.pdf'));
  res.json({ files: pdfFiles });
}));

// PDF dosyası yükle
app.post('/api/upload-pdf', (req, res) => {
  upload.array('pdfs', 10)(req, res, (err) => {
    if (err) {
      console.error('Multer hatası:', err);
      return res.status(400).json({ 
        error: 'Dosya yüklenirken bir hata oluştu: ' + (err.message || 'Bilinmeyen hata')
      });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Hiç PDF dosyası yüklenmedi.' });
    }
    
    const uploadedFiles = req.files.map(file => file.originalname);
    res.json({ 
      success: true, 
      message: `${uploadedFiles.length} PDF dosyası başarıyla yüklendi.`,
      files: uploadedFiles 
    });
  });
});

// Vektör veritabanını başlat
app.post('/api/initialize', asyncHandler(async (req, res) => {
  const success = await initializeVectorStore();
  
  if (success) {
    res.json({ success: true, message: 'Vektör veritabanı başarıyla oluşturuldu.' });
  } else {
    res.status(500).json({ success: false, error: 'Vektör veritabanı oluşturulamadı.' });
  }
}));

// Soruları yanıtla
app.post('/api/ask', asyncHandler(async (req, res) => {
  const { question } = req.body;
  
  if (!question) {
    return res.status(400).json({ error: 'Soru gönderilmedi.' });
  }
  
  const answer = await answerQuestion(question);
  res.json({ answer });
}));

// Global hata işleyicisi
app.use((err, req, res, next) => {
  console.error('Sunucu hatası:', err);
  res.status(500).json({ 
    error: 'Sunucuda bir hata oluştu', 
    message: err.message || 'Bilinmeyen hata' 
  });
});

// 404 handler (tüm diğer route'lardan sonra)
app.use((req, res) => {
  res.status(404).json({ error: 'Sayfa bulunamadı' });
});

// Sunucuyu başlat
app.listen(PORT, () => {
  console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor.`);
});