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

// API isteği işleyici yardımcı fonksiyon
async function handleApiRequest(url, options, errorMessage) {
  try {
    const response = await fetch(url, options);
    let result;
    
    // Yanıt türüne göre işleyin
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      result = await response.json();
    } else {
      throw new Error(`Geçersiz yanıt türü: ${contentType}. JSON bekleniyor.`);
    }
    
    if (!response.ok) {
      throw new Error(result.error || `HTTP hata kodu: ${response.status}`);
    }
    
    return { success: true, data: result };
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    return { 
      success: false, 
      error: error.message || errorMessage 
    };
  }
}

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
  
  const result = await handleApiRequest(
    '/api/upload-pdf',
    { method: 'POST', body: formData },
    'PDF yüklenirken hata oluştu'
  );
  
  if (result.success) {
    showMessage(result.data.message, 'bot-message');
    const pdfListResult = await fetchPDFList();
    if (pdfListResult.success) {
      // Yükleme başarılı olduysa, vektör veritabanının yeniden oluşturulması gerektiğini işaret et
      isInitialized = false;
    }
  } else {
    showMessage(`Hata: ${result.error}`, 'bot-message');
  }
  
  uploadBtn.disabled = false;
  uploadBtn.textContent = 'PDF Yükle';
  uploadForm.reset();
});

// PDF listesini getir
async function fetchPDFList() {
  const result = await handleApiRequest(
    '/api/pdf-list',
    { method: 'GET' },
    'PDF listesi alınırken hata oluştu'
  );
  
  if (result.success) {
    pdfList.innerHTML = '';
    
    const files = result.data.files || [];
    
    if (files.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'Henüz PDF dosyası yüklenmemiş.';
      pdfList.appendChild(li);
      initializeBtn.disabled = true;
    } else {
      files.forEach(file => {
        const li = document.createElement('li');
        li.textContent = file;
        pdfList.appendChild(li);
      });
      initializeBtn.disabled = false;
    }
  } else {
    console.error('PDF listesi alınamadı:', result.error);
    // Hata mesajı gösterme
    const li = document.createElement('li');
    li.textContent = `Liste alınamadı: ${result.error}`;
    li.className = 'error';
    pdfList.innerHTML = '';
    pdfList.appendChild(li);
  }
  
  return result;
}

// Vektör veritabanını başlat
initializeBtn.addEventListener('click', async () => {
  initializeBtn.disabled = true;
  initializeBtn.textContent = 'Başlatılıyor...';
  showMessage('Vektör veritabanı oluşturuluyor, lütfen bekleyin...', 'bot-message');
  
  const result = await handleApiRequest(
    '/api/initialize',
    { method: 'POST' },
    'Veritabanı başlatılırken hata oluştu'
  );
  
  if (result.success) {
    showMessage(result.data.message, 'bot-message');
    isInitialized = true;
  } else {
    showMessage(`Hata: ${result.error}`, 'bot-message');
  }
  
  initializeBtn.disabled = false;
  initializeBtn.textContent = 'Veritabanını Başlat';
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
  
  const result = await handleApiRequest(
    '/api/ask',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ question })
    },
    'Soru yanıtlanırken hata oluştu'
  );
  
  if (result.success) {
    showMessage(result.data.answer, 'bot-message');
  } else {
    showMessage(`Hata: ${result.error}`, 'bot-message');
  }
  
  askBtn.disabled = false;
  askBtn.textContent = 'Sor';
}

// Mesaj gösterme işlemi
function showMessage(content, className) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${className}`;
  messageDiv.textContent = content;
  
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}