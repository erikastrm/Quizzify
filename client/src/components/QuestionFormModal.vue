<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>{{ isEditing ? 'Redigera fråga' : 'Skapa ny fråga' }}</h3>
        <button class="close-btn" @click="closeModal">✕</button>
      </div>

      <form @submit.prevent="saveQuestion" class="question-form">
        <!-- Fråga -->
        <div class="form-group">
          <label class="label">Fråga *</label>
          <textarea
            v-model="form.question"
            class="input textarea"
            placeholder="Skriv din fråga här..."
            rows="3"
            required
          ></textarea>
        </div>

        <!-- Bild-URL (valfritt) -->
        <div class="form-group">
          <label class="label">Media (valfritt)</label>
          
          <!-- Media-typ väljare -->
          <div class="media-type-selector">
            <button 
              type="button"
              v-for="type in mediaTypes" 
              :key="type.value"
              @click="form.media_type = type.value"
              :class="{ active: form.media_type === type.value }"
              class="media-type-btn"
            >
              {{ type.icon }} {{ type.label }}
            </button>
          </div>

          <!-- Om mediatyp är vald (inte 'none') -->
          <div v-if="form.media_type !== 'none'" class="media-upload-section">
            <!-- Uppladdningsområde -->
            <div 
              v-if="!form.media_url"
              @drop.prevent="handleDrop"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              :class="{ dragging: isDragging }"
              class="upload-area"
            >
              <input 
                ref="fileInput"
                type="file"
                @change="handleFileSelect"
                :accept="acceptedFileTypes"
                style="display: none"
              />
              
              <div class="upload-content">
                <div class="upload-icon">📁</div>
                <p>Dra och släpp en fil här eller</p>
                <button type="button" @click="$refs.fileInput.click()" class="btn-upload">
                  Välj fil
                </button>
                <button type="button" @click="showMediaLibrary = true" class="btn-library">
                  📚 Välj från bibliotek
                </button>
              </div>

              <div v-if="uploadProgress > 0 && uploadProgress < 100" class="progress-bar">
                <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
              </div>
            </div>

            <!-- Förhandsvisning av vald media -->
            <div v-if="form.media_url" class="media-preview-container">
              <!-- Bild -->
              <div v-if="form.media_type === 'image'" class="media-preview">
                <img :src="getMediaUrl(form.media_url)" alt="Förhandsvisning" />
              </div>
              
              <!-- Ljud -->
              <div v-else-if="form.media_type === 'audio'" class="media-preview audio">
                <div class="audio-icon">🎵</div>
                <audio :src="getMediaUrl(form.media_url)" controls></audio>
              </div>
              
              <!-- Video -->
              <div v-else-if="form.media_type === 'video'" class="media-preview video">
                <video :src="getMediaUrl(form.media_url)" controls></video>
              </div>

              <button type="button" @click="removeMedia" class="btn-remove-media">
                ✕ Ta bort media
              </button>
            </div>
          </div>

          <small class="helper-text">
            Lägg till en bild, ljud eller video till frågan
          </small>
        </div>

        <!-- Svarsalternativ -->
        <div class="options-grid">
          <div class="form-group">
            <label class="label">Alternativ A *</label>
            <input
              v-model="form.option_a"
              type="text"
              class="input"
              placeholder="Alternativ A"
              required
            />
          </div>
          <div class="form-group">
            <label class="label">Alternativ B *</label>
            <input
              v-model="form.option_b"
              type="text"
              class="input"
              placeholder="Alternativ B"
              required
            />
          </div>
          <div class="form-group">
            <label class="label">Alternativ C *</label>
            <input
              v-model="form.option_c"
              type="text"
              class="input"
              placeholder="Alternativ C"
              required
            />
          </div>
          <div class="form-group">
            <label class="label">Alternativ D *</label>
            <input
              v-model="form.option_d"
              type="text"
              class="input"
              placeholder="Alternativ D"
              required
            />
          </div>
        </div>

        <!-- Rätt svar -->
        <div class="form-group">
          <label class="label">Rätt svar *</label>
          <select v-model="form.correct_answer" class="input" required>
            <option value="">Välj rätt svar</option>
            <option value="A">A - {{ form.option_a || 'Alternativ A' }}</option>
            <option value="B">B - {{ form.option_b || 'Alternativ B' }}</option>
            <option value="C">C - {{ form.option_c || 'Alternativ C' }}</option>
            <option value="D">D - {{ form.option_d || 'Alternativ D' }}</option>
          </select>
        </div>

        <!-- Metadata -->
        <div class="metadata-grid">
          <div class="form-group">
            <label class="label">Kategori</label>
            <input
              v-model="form.category"
              type="text"
              class="input"
              placeholder="t.ex. Historia, Sport, etc."
            />
          </div>
          <div class="form-group">
            <label class="label">Svårighetsgrad</label>
            <select v-model="form.difficulty" class="input">
              <option value="easy">Lätt</option>
              <option value="medium">Medel</option>
              <option value="hard">Svår</option>
            </select>
          </div>
          <div class="form-group">
            <label class="label">Tidsgräns (sekunder)</label>
            <input
              v-model.number="form.time_limit"
              type="number"
              class="input"
              min="10"
              max="120"
              placeholder="30"
            />
          </div>
        </div>

        <!-- Preview -->
        <div v-if="canPreview" class="preview-section">
          <h4>Förhandsvisning</h4>
          <div class="question-preview">
            <div class="preview-question">{{ form.question }}</div>
            <div class="preview-options">
              <div class="preview-option" :class="{ correct: form.correct_answer === 'A' }">
                <strong>A:</strong> {{ form.option_a }}
              </div>
              <div class="preview-option" :class="{ correct: form.correct_answer === 'B' }">
                <strong>B:</strong> {{ form.option_b }}
              </div>
              <div class="preview-option" :class="{ correct: form.correct_answer === 'C' }">
                <strong>C:</strong> {{ form.option_c }}
              </div>
              <div class="preview-option" :class="{ correct: form.correct_answer === 'D' }">
                <strong>D:</strong> {{ form.option_d }}
              </div>
            </div>
          </div>
        </div>

        <!-- Knappar -->
        <div class="form-actions">
          <button type="button" class="button secondary" @click="closeModal">
            Avbryt
          </button>
          <button type="submit" class="button" :disabled="!isFormValid || isSaving">
            <span v-if="isSaving">Sparar...</span>
            <span v-else>{{ isEditing ? 'Uppdatera' : 'Skapa' }} fråga</span>
          </button>
        </div>
      </form>
    </div>

    <!-- MediaLibrary Modal -->
    <div v-if="showMediaLibrary" class="media-library-modal">
      <div class="media-library-content" @click.stop>
        <div class="media-library-header">
          <h3>Mediabibliotek</h3>
          <button class="close-btn" @click="showMediaLibrary = false">✕</button>
        </div>
        <MediaLibrary 
          :initialType="form.media_type !== 'none' ? form.media_type : null"
          @select="selectFromLibrary"
          @close="showMediaLibrary = false"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, inject } from 'vue'
import axios from 'axios'
import apiService from '../services/api'
import MediaLibrary from './MediaLibrary.vue'

export default {
  name: 'QuestionFormModal',
  components: {
    MediaLibrary
  },
  props: {
    question: {
      type: Object,
      default: null
    }
  },
  emits: ['close', 'saved'],
  setup(props, { emit }) {
    const showToast = inject('showToast')

    const isSaving = ref(false)
    const isDragging = ref(false)
    const uploadProgress = ref(0)
    const showMediaLibrary = ref(false)
    const fileInput = ref(null)
    
    const form = ref({
      question: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: '',
      category: '',
      difficulty: 'medium',
      time_limit: 30,
      media_url: '',
      media_type: 'none'
    })

    const mediaTypes = ref([
      { value: 'none', label: 'Ingen', icon: '🚫' },
      { value: 'image', label: 'Bild', icon: '🖼️' },
      { value: 'audio', label: 'Ljud', icon: '🎵' },
      { value: 'video', label: 'Video', icon: '🎬' }
    ])

    // Computed
    const isEditing = computed(() => !!props.question)
    
    const isFormValid = computed(() => {
      return form.value.question.trim() &&
             form.value.option_a.trim() &&
             form.value.option_b.trim() &&
             form.value.option_c.trim() &&
             form.value.option_d.trim() &&
             form.value.correct_answer
    })

    const canPreview = computed(() => {
      return form.value.question &&
             form.value.option_a &&
             form.value.option_b &&
             form.value.option_c &&
             form.value.option_d
    })

    const acceptedFileTypes = computed(() => {
      const types = {
        image: 'image/jpeg,image/png,image/gif,image/webp',
        audio: 'audio/mpeg,audio/mp3,audio/wav,audio/ogg',
        video: 'video/mp4,video/webm,video/ogg'
      }
      return types[form.value.media_type] || '*'
    })

    /**
     * Initiera formulär
     */
    onMounted(() => {
      if (props.question) {
        // Fyll formulär med befintliga data
        form.value = {
          question: props.question.question || '',
          option_a: props.question.option_a || '',
          option_b: props.question.option_b || '',
          option_c: props.question.option_c || '',
          option_d: props.question.option_d || '',
          correct_answer: props.question.correct_answer || '',
          category: props.question.category || '',
          difficulty: props.question.difficulty || 'medium',
          time_limit: props.question.time_limit || 30,
          media_url: props.question.media_url || '',
          media_type: props.question.media_type || 'none'
        }
      }
    })

    /**
     * Hantera filval
     */
    async function handleFileSelect(event) {
      const file = event.target.files[0]
      if (file) {
        await uploadFile(file)
      }
    }

    /**
     * Hantera drag & drop
     */
    async function handleDrop(event) {
      isDragging.value = false
      const file = event.dataTransfer.files[0]
      if (file) {
        await uploadFile(file)
      }
    }

    /**
     * Ladda upp fil
     */
    async function uploadFile(file) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('media_type', form.value.media_type)

      try {
        uploadProgress.value = 10
        
        const response = await axios.post('http://localhost:3001/api/media/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          }
        })

        if (response.data.success) {
          form.value.media_url = response.data.file.file_path
          showToast('Fil uppladdad!', 'success')
        }
      } catch (error) {
        console.error('Uppladdningsfel:', error)
        showToast('Kunde inte ladda upp fil', 'error')
      } finally {
        uploadProgress.value = 0
      }
    }

    /**
     * Välj från mediabibliotek
     */
    function selectFromLibrary(file) {
      form.value.media_url = file.file_path
      form.value.media_type = file.media_type
      showMediaLibrary.value = false
      showToast('Media vald från bibliotek', 'success')
    }

    /**
     * Ta bort media
     */
    function removeMedia() {
      form.value.media_url = ''
    }

    /**
     * Hämta media URL
     */
    function getMediaUrl(path) {
      if (!path) return ''
      if (path.startsWith('http')) return path
      return `http://localhost:3001${path}`
    }

    /**
     * Spara fråga
     */
    async function saveQuestion() {
      if (!isFormValid.value) return

      isSaving.value = true

      try {
        let response
        if (isEditing.value) {
          response = await apiService.updateQuestion(props.question.id, form.value)
        } else {
          response = await apiService.createQuestion(form.value)
        }

        if (response.success) {
          emit('saved', response.data)
          showToast(
            isEditing.value ? 'Fråga uppdaterad' : 'Fråga skapad',
            'success'
          )
        }
      } catch (error) {
        console.error('Fel vid sparande:', error)
        showToast(
          isEditing.value ? 'Kunde inte uppdatera fråga' : 'Kunde inte skapa fråga',
          'error'
        )
      } finally {
        isSaving.value = false
      }
    }

    /**
     * Stäng modal
     */
    function closeModal() {
      emit('close')
    }

    return {
      form,
      isSaving,
      isDragging,
      uploadProgress,
      showMediaLibrary,
      fileInput,
      mediaTypes,
      isEditing,
      isFormValid,
      canPreview,
      acceptedFileTypes,
      handleFileSelect,
      handleDrop,
      selectFromLibrary,
      removeMedia,
      getMediaUrl,
      saveQuestion,
      closeModal
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 1rem;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  color: #374151;
  font-size: 1.2rem;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0.5rem;
  border-radius: 0.25rem;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #374151;
}

.question-form {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.helper-text {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
  display: block;
}

.media-type-selector {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.media-type-btn {
  padding: 8px 16px;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;
}

.media-type-btn:hover {
  border-color: #667eea;
}

.media-type-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.media-upload-section {
  margin-top: 15px;
}

.upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  transition: all 0.3s;
  background: #f9fafb;
}

.upload-area.dragging {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.05);
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.upload-icon {
  font-size: 48px;
}

.btn-upload, .btn-library {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
  margin-top: 5px;
}

.btn-upload {
  background: #667eea;
  color: white;
}

.btn-upload:hover {
  background: #5568d3;
}

.btn-library {
  background: #f3f4f6;
  color: #374151;
}

.btn-library:hover {
  background: #e5e7eb;
}

.progress-bar {
  margin-top: 15px;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #667eea;
  transition: width 0.3s;
}

.media-preview-container {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 15px;
  background: #f9fafb;
}

.media-preview {
  width: 100%;
  max-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 10px;
}

.media-preview img {
  max-width: 100%;
  max-height: 300px;
  object-fit: contain;
}

.media-preview.audio {
  flex-direction: column;
  padding: 20px;
}

.audio-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.media-preview audio {
  width: 100%;
}

.media-preview.video {
  padding: 0;
}

.media-preview video {
  max-width: 100%;
  max-height: 300px;
}

.btn-remove-media {
  width: 100%;
  padding: 10px;
  border: none;
  background: #ef4444;
  color: white;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
}

.btn-remove-media:hover {
  background: #dc2626;
}

.media-library-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}

.media-library-content {
  background: white;
  border-radius: 1rem;
  width: 100%;
  max-width: 1000px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
}

.media-library-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 2px solid #e5e7eb;
}

.media-library-header h3 {
  margin: 0;
  color: #374151;
}

.image-preview {
  margin-top: 1rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 0.5rem;
  overflow: hidden;
  background: #f9fafb;
}

.image-preview img {
  width: 100%;
  max-height: 300px;
  object-fit: contain;
  display: block;
}

.error-text {
  color: #ef4444;
  font-size: 0.875rem;
  padding: 1rem;
  margin: 0;
}

.textarea {
  resize: vertical;
  min-height: 80px;
}

.options-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.metadata-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 1rem;
}

.preview-section {
  background: rgba(102, 126, 234, 0.05);
  border: 1px solid rgba(102, 126, 234, 0.2);
  border-radius: 0.75rem;
  padding: 1rem;
}

.preview-section h4 {
  color: #667eea;
  margin-bottom: 1rem;
  font-size: 1rem;
}

.question-preview {
  background: white;
  border-radius: 0.5rem;
  padding: 1rem;
}

.preview-question {
  font-weight: 600;
  color: #374151;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.preview-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.preview-option {
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 0.25rem;
  font-size: 0.9rem;
}

.preview-option.correct {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

@media (max-width: 768px) {
  .modal-overlay {
    padding: 0.5rem;
  }

  .modal-content {
    max-height: 95vh;
  }

  .modal-header {
    padding: 1rem;
  }

  .question-form {
    padding: 1rem;
  }

  .options-grid,
  .metadata-grid {
    grid-template-columns: 1fr;
  }

  .preview-options {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }
}
</style>