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
          <label class="label">Bild-URL (valfritt)</label>
          <input
            v-model="form.image_url"
            type="url"
            class="input"
            placeholder="https://example.com/image.jpg"
          />
          <small class="helper-text">
            Lägg till en bild till frågan (t.ex. "Vilket djur är detta?")
          </small>
          <!-- Bild-förhandsvisning -->
          <div v-if="form.image_url" class="image-preview">
            <img :src="form.image_url" alt="Fråge-bild förhandsvisning" @error="imageLoadError = true" />
            <p v-if="imageLoadError" class="error-text">Kunde inte ladda bilden. Kontrollera URL:en.</p>
          </div>
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
  </div>
</template>

<script>
import { ref, computed, onMounted, inject } from 'vue'
import apiService from '../services/api'

export default {
  name: 'QuestionFormModal',
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
      image_url: ''
    })
    
    const imageLoadError = ref(false)

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
          image_url: props.question.image_url || ''
        }
      }
    })

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
      imageLoadError,
      isSaving,
      isEditing,
      isFormValid,
      canPreview,
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