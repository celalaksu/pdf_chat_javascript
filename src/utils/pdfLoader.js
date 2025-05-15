const fs = require('fs');
const path = require('path');
const { PDFLoader } = require("@langchain/community/document_loaders/fs/pdf");

/**
 * PDF klasöründeki tüm PDF dosyalarını yükler ve içeriklerini çıkarır
 * @returns {Promise<Array>} - PDF içeriklerini içeren belge dizisi ve işlenen dosya yolları
 */
async function loadPDFDocuments() {
  const pdfDirectory = path.join(__dirname, '../../public/pdfs');
  const pdfFiles = fs.readdirSync(pdfDirectory).filter(file => file.endsWith('.pdf'));
  
  console.log(`${pdfFiles.length} PDF dosyası bulundu.`);
  
  const allDocuments = [];
  const processedFilePaths = []; // İşlenen dosya yollarını takip etmek için
  
  for (const pdfFile of pdfFiles) {
    const pdfPath = path.join(pdfDirectory, pdfFile);
    console.log(`${pdfFile} yükleniyor...`);
    
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
      processedFilePaths.push(pdfPath); // İşlenen dosya yolunu kaydet
      console.log(`${pdfFile}: ${processedDocuments.length} sayfa işlendi.`);
    } catch (error) {
      console.error(`${pdfFile} yüklenirken hata oluştu:`, error);
    }
  }
  
  return { documents: allDocuments, filePaths: processedFilePaths };
}

/**
 * Belirtilen dosya yollarındaki PDF dosyalarını siler
 * @param {Array<string>} filePaths - Silinecek dosyaların tam yolları
 * @returns {Promise<void>}
 */
async function deleteProcessedPDFs(filePaths) {
  if (!filePaths || filePaths.length === 0) {
    console.log('Silinecek dosya bulunamadı.');
    return;
  }
  
  let deletedCount = 0;
  let errorCount = 0;
  
  for (const filePath of filePaths) {
    try {
      fs.unlinkSync(filePath);
      deletedCount++;
      console.log(`Silindi: ${path.basename(filePath)}`);
    } catch (error) {
      errorCount++;
      console.error(`${path.basename(filePath)} silinirken hata oluştu:`, error.message);
    }
  }
  
  console.log(`İşlem tamamlandı: ${deletedCount} dosya silindi, ${errorCount} hata oluştu.`);
}

module.exports = { 
  loadPDFDocuments,
  deleteProcessedPDFs 
};