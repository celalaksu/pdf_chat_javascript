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

// PDF dosyaları için upload ayarları
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/pdfs'));
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
  }
});

// Ana sayfa
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// PDF dosyalarını listele
app.get('/api/pdf-list', (req, res) => {
  const pdfDir = path.join(__dirname, '../public/pdfs');
  
  // Klasör yoksa oluştur
  if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir, { recursive: true });
  }
  
  fs.readdir(pdfDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'PDF dosyaları listelenirken bir hata oluştu.' });
    }
    
    const pdfFiles = files.filter(file => file.endsWith('.pdf'));
    res.json({ files: pdfFiles });
  });
});

// PDF dosyası yükle
app.post('/api/upload-pdf', upload.array('pdfs', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Hiç PDF dosyası yüklenmedi.' });
    }
    
    const uploadedFiles = req.files.map(file => file.originalname);
    res.json({ 
      success: true, 
      message: `${uploadedFiles.length} PDF dosyası başarıyla yüklendi.`,
      files: uploadedFiles 
    });
  } catch (error) {
    res.status(500).json({ error: 'Dosya yüklenirken bir hata oluştu: ' + error.message });
  }
});

// Vektör veritabanını başlat
app.post('/api/initialize', async (req, res) => {
  try {
    const success = await initializeVectorStore();
    
    if (success) {
      res.json({ success: true, message: 'Vektör veritabanı başarıyla oluşturuldu.' });
    } else {
      res.status(500).json({ success: false, error: 'Vektör veritabanı oluşturulamadı.' });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Vektör veritabanı oluşturulurken bir hata oluştu: ' + error.message 
    });
  }
});

// Soruları yanıtla
app.post('/api/ask', async (req, res) => {
  const { question } = req.body;
  
  if (!question) {
    return res.status(400).json({ error: 'Soru gönderilmedi.' });
  }
  
  try {
    const answer = await answerQuestion(question);
    res.json({ answer });
  } catch (error) {
    res.status(500).json({ error: 'Soru yanıtlanırken bir hata oluştu: ' + error.message });
  }
});

// Sunucuyu başlat
app.listen(PORT, () => {
  console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor.`);
});