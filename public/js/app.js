// DOM elementlerini seçme
const uploadForm = document.getElementById('upload-form');
const pdfUpload = document.getElementById('pdf-upload');
const uploadBtn = document.getElementById('upload-btn');
const pdfList = document.getElementById('pdf-list');
const initializeBtn = document.getElementById('initialize-btn');
const chatMessages = document.getElementById('chat-messages');
const questionInput = document.getElementById('question-input');
const askBtn = document.getElementById('ask-btn');

// Uygulama durumu
let isInitialized = false;

// Sayfa yüklendiğinde PDF listesini güncelle
document.addEventListener('DOMContentLoaded', () => {
  fetchPDFList();
});

// PDF dosyası yükleme işlemi
uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const files = pdfUpload.files;
  if (files.length === 0) {
    showMessage('Lütfen en az bir PDF dosyası seçin.', 'bot-message');
    return;
  }
  
  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append('pdfs', files[i]);
  }
  
  uploadBtn.disabled = true;
  uploadBtn.textContent = 'Yükleniyor...';
  
  try {
    const response = await fetch('/api/upload-pdf', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (response.ok) {
      showMessage(`${result.message}`, 'bot-message');
      fetchPDFList();
      // Yükleme başarılı olduysa, vektör veritabanının yeniden oluşturulması gerektiğini işaret et
      isInitialized = false;
    } else {
      showMessage(`Hata: ${result.error}`, 'bot-message');
    }
  } catch (error) {
    showMessage(`Bir hata oluştu: ${error.message}`, 'bot-message');
  } finally {
    uploadBtn.disabled = false;
    uploadBtn.textContent = 'PDF Yükle';
    uploadForm.reset();
  }
});

// PDF listesini getir
async function fetchPDFList() {
  try {
    const response = await fetch('/api/pdf-list');
    const result = await response.json();
    
    pdfList.innerHTML = '';
    
    if (result.files.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'Henüz PDF dosyası yüklenmemiş.';
      pdfList.appendChild(li);
      initializeBtn.disabled = true;
    } else {
      result.files.forEach(file => {
        const li = document.createElement('li');
        li.textContent = file;
        pdfList.appendChild(li);
      });
      initializeBtn.disabled = false;
    }
  } catch (error) {
    console.error('PDF listesi alınırken bir hata oluştu:', error);
  }
}

// Vektör veritabanını başlat
initializeBtn.addEventListener('click', async () => {
  initializeBtn.disabled = true;
  initializeBtn.textContent = 'Başlatılıyor...';
  showMessage('Vektör veritabanı oluşturuluyor, lütfen bekleyin...', 'bot-message');
  
  try {
    const response = await fetch('/api/initialize', {
      method: 'POST'
    });
    
    const result = await response.json();
    
    if (response.ok) {
      showMessage(result.message, 'bot-message');
      isInitialized = true;
    } else {
      showMessage(`Hata: ${result.error}`, 'bot-message');
    }
  } catch (error) {
    showMessage(`Bir hata oluştu: ${error.message}`, 'bot-message');
  } finally {
    initializeBtn.disabled = false;
    initializeBtn.textContent = 'Veritabanını Başlat';
  }
});

// Soru sorma işlemi
askBtn.addEventListener('click', async () => {
  askQuestion();
});

questionInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    askQuestion();
  }
});

async function askQuestion() {
  const question = questionInput.value.trim();
  
  if (!question) {
    return;
  }
  
  if (!isInitialized) {
    showMessage('Lütfen önce veritabanını başlatın.', 'bot-message');
    return;
  }
  
  showMessage(question, 'user-message');
  questionInput.value = '';
  askBtn.disabled = true;
  askBtn.textContent = 'Yanıtlanıyor...';
  
  try {
    const response = await fetch('/api/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ question })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      showMessage(result.answer, 'bot-message');
    } else {
      showMessage(`Hata: ${result.error}`, 'bot-message');
    }
  } catch (error) {
    showMessage(`Bir hata oluştu: ${error.message}`, 'bot-message');
  } finally {
    askBtn.disabled = false;
    askBtn.textContent = 'Sor';
  }
}

// Mesaj gösterme işlemi
function showMessage(content, className) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${className}`;
  messageDiv.textContent = content;
  
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}