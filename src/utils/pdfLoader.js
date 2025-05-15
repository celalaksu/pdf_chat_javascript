const fs = require('fs');
const path = require('path');
const { PDFLoader } = require("@langchain/community/document_loaders/fs/pdf");

/**
 * PDF klasöründeki tüm PDF dosyalarını yükler ve içeriklerini çıkarır
 * @returns {Promise<Object>} - PDF içeriklerini içeren belge dizisi
 */
async function loadPDFDocuments() {
  const pdfDirectory = path.join(__dirname, '../../public/pdfs');
  const pdfFiles = fs.readdirSync(pdfDirectory).filter(file => file.endsWith('.pdf'));
  
  console.log(`${pdfFiles.length} PDF dosyası bulundu.`);
  
  const allDocuments = [];
  
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
      console.log(`${pdfFile}: ${processedDocuments.length} sayfa işlendi.`);
    } catch (error) {
      console.error(`${pdfFile} yüklenirken hata oluştu:`, error);
    }
  }
  
  return { documents: allDocuments };
}

module.exports = { 
  loadPDFDocuments
};