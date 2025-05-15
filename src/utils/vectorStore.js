const fs = require('fs');
const path = require('path');
const { MemoryVectorStore } = require("langchain/vectorstores/memory");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");

// API anahtarını ortam değişkeninden al
const apiKey = process.env.GOOGLE_API_KEY;

// Google Generative AI için yapılandırma
const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Google Embedding API ile metin için embedding oluşturan fonksiyon
 */
class GoogleEmbeddingModel {
  constructor() {
    this.embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });
  }

  async embedDocuments(texts) {
    const embeddings = [];
    for (const text of texts) {
      try {
        const result = await this.embeddingModel.embedContent(text, { taskType: "RETRIEVAL_DOCUMENT" });
        embeddings.push(result.embedding.values);
      } catch (error) {
        console.error("Embedding oluşturulurken hata:", error);
        // Hata olduğunda boş bir embedding yerine 0 vektörü oluştur
        embeddings.push(new Array(768).fill(0)); // Örnek boyut 768, model boyutuna göre değişebilir
      }
    }
    return embeddings;
  }

  async embedQuery(text) {
    try {
      const result = await this.embeddingModel.embedContent(text, { taskType: "RETRIEVAL_QUERY" });
      return result.embedding.values;
    } catch (error) {
      console.error("Query embedding oluşturulurken hata:", error);
      // Hata olduğunda 0 vektörü döndür
      return new Array(768).fill(0); // Örnek boyut 768, model boyutuna göre değişebilir
    }
  }
}

/**
 * Belgeleri işleyip vektör veritabanı oluşturur
 * @param {Array} documents - İşlenecek belgeler
 * @returns {Promise<MemoryVectorStore>} - Oluşturulan vektör veritabanı
 */
async function createVectorStore(documents) {
  console.log("Belgeler işleniyor ve vektör veritabanı oluşturuluyor...");
  
  // Belgeleri daha küçük parçalara ayırın
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  
  const splitDocs = await textSplitter.splitDocuments(documents);
  console.log(`Belgeler ${splitDocs.length} parçaya bölündü.`);
  
  // Google Embedding API kullanarak vektör veritabanı oluşturun
  const embeddings = new GoogleEmbeddingModel();
  const vectorStore = await MemoryVectorStore.fromDocuments(splitDocs, embeddings);
  
  console.log("Vektör veritabanı başarıyla oluşturuldu.");
  
  return vectorStore;
}

/**
 * Verilen sorguya göre ilgili dökümanları getirir
 * @param {MemoryVectorStore} vectorStore - Vektör veritabanı
 * @param {string} query - Sorgu metni
 * @param {number} k - Getirilecek belge sayısı
 * @returns {Promise<Array>} - İlgili belgeler
 */
async function retrieveSimilarDocuments(vectorStore, query, k = 5) {
  console.log(`"${query}" sorgusu için benzer belgeler aranıyor...`);
  
  const results = await vectorStore.similaritySearch(query, k);
  
  console.log(`${results.length} benzer belge bulundu.`);
  return results;
}

module.exports = {
  createVectorStore,
  retrieveSimilarDocuments
};