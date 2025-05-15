require('dotenv').config();
const { loadPDFDocuments, deleteProcessedPDFs } = require('./utils/pdfLoader');
const { createVectorStore, retrieveSimilarDocuments } = require('./utils/vectorStore');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// API anahtarını doğrudan Google modeli için yapılandır
const apiKey = process.env.GOOGLE_API_KEY;

// Gemini API için yapılandırma
const genAI = new GoogleGenerativeAI(apiKey);

let vectorStore = null;

/**
 * PDF dosyalarını yükleyip vektör veritabanına dönüştürür ve sonrasında PDF dosyalarını siler
 * @returns {Promise<boolean>} - İşlemin başarılı olup olmadığı
 */
async function initializeVectorStore() {
  try {
    const result = await loadPDFDocuments();
    const { documents, filePaths } = result;
    
    if (documents.length > 0) {
      vectorStore = await createVectorStore(documents);
      console.log('Vektör veritabanı başarıyla oluşturuldu.');
      
      // PDF dosyaları vektör veritabanına işlendikten sonra fiziksel olarak sil
      await deleteProcessedPDFs(filePaths);
      
      return true;
    } else {
      console.log('Hiç PDF dosyası bulunamadığından vektör veritabanı oluşturulamadı.');
      return false;
    }
  } catch (error) {
    console.error('Vektör veritabanı oluşturulurken bir hata oluştu:', error);
    return false;
  }
}

/**
 * Kullanıcı sorusunu PDF içeriğine göre yanıtlar
 * @param {string} question - Kullanıcı sorusu
 * @returns {Promise<string>} - Yanıt
 */
async function answerQuestion(question) {
  if (!vectorStore) {
    return "Vektör veritabanı henüz oluşturulmadı. Lütfen önce PDF dosyalarını yükleyin.";
  }

  try {
    // İlgili belgeleri getir
    const relevantDocs = await retrieveSimilarDocuments(vectorStore, question, 3);
    
    if (relevantDocs.length === 0) {
      return "Bu soru hakkında bilgi bulunamadı.";
    }
    
    // İlgili içeriği topla
    const context = relevantDocs.map(doc => doc.pageContent).join('\n\n');
    
    // Gemini modeli doğrudan kullanılarak chat tamamlama
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // Prompt oluştur
    const promptText = `Aşağıdaki bilgilere dayanarak soruda belirtilen konu hakkında bilgi verin. Eğer yanıt belgede yoksa, lütfen "Bu sorunun yanıtı belgede mevcut değil" deyin.
      
      Belge içeriği:
      ${context}
      
      Soru: ${question}
      
      Yanıt:`;
    
    // Gemini API ile yanıt oluştur
    const result = await model.generateContent(promptText);
    const response = result.response.text();
    
    return response;
  } catch (error) {
    console.error('Soru yanıtlanırken bir hata oluştu:', error);
    return "Bir hata oluştu: " + error.message;
  }
}

module.exports = {
  initializeVectorStore,
  answerQuestion
};