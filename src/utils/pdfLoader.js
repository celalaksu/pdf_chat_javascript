const fs = require('fs');
const path = require('path');
const { PDFLoader } = require("@langchain/community/document_loaders/fs/pdf");
const os = require('os');

// Vercel ortamını tespit et
const isVercel = process.env.VERCEL === '1';

/**
 * PDF klasöründeki tüm PDF dosyalarını yükler ve içeriklerini çıkarır
 * @returns {Promise<Object>} - PDF içeriklerini içeren belge dizisi
 */
async function loadPDFDocuments() {
  // Ortama göre PDF dizinini belirle
  let pdfDirectory;
  if (isVercel) {
    pdfDirectory = path.join(os.tmpdir(), 'pdfs');
  } else {
    pdfDirectory = path.join(__dirname, '../../public/pdfs');
  }

  // Dizin yoksa, oluştur
  if (!fs.existsSync(pdfDirectory)) {
    try {
      fs.mkdirSync(pdfDirectory, { recursive: true });
      console.log('PDF dizini oluşturuldu:', pdfDirectory);
    } catch (error) {
      console.error('PDF dizini oluşturulurken hata:', error);
    }
  }
  
  try {
    const pdfFiles = fs.readdirSync(pdfDirectory).filter(file => file.endsWith('.pdf'));
    console.log(`${pdfFiles.length} PDF dosyası bulundu. Dizin: ${pdfDirectory}`);
    
    const allDocuments = [];
    
    for (const pdfFile of pdfFiles) {
      const pdfPath = path.join(pdfDirectory, pdfFile);
      console.log(`${pdfFile} yükleniyor... Yol: ${pdfPath}`);
      
      try {
        const loader = new PDFLoader(pdfPath, {
          splitPages: true
        });
        
        const documents = await loader.load();
        
        // Her belgeye dosya adını metadata olarak ekleyin
        const processedDocuments = documents.map(doc => {
          doc.metadata.source = pdfFile;
          return doc;
        });
        
        allDocuments.push(...processedDocuments);
        console.log(`${pdfFile}: ${processedDocuments.length} sayfa işlendi.`);
      } catch (error) {
        console.error(`${pdfFile} yüklenirken hata oluştu:`, error);
        console.error('Hata detayları:', error.stack || error);
      }
    }
    
    return { documents: allDocuments };
  } catch (error) {
    console.error(`PDF dizini (${pdfDirectory}) okunurken hata oluştu:`, error);
    return { documents: [] };
  }
}

module.exports = { 
  loadPDFDocuments
};