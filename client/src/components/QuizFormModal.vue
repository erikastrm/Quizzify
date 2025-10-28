<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content large" @click.stop>
      <div class="modal-header">
        <h3>{{ isEditing ? 'Redigera quiz' : 'Skapa nytt quiz' }}</h3>
        <button class="close-btn" @click="closeModal">✕</button>
      </div>

      <form @submit.prevent="saveQuiz" class="quiz-form">
        <!-- Quiz-namn -->
        <div class="form-group">
          <label class="label">Quiz-namn *</label>
          <input
            v-model="form.name"
            type="text"
            class="input"
            placeholder="T.ex. Filmkunskap, Geografi, Allmänbildning..."
            required
          />
        </div>

        <!-- Beskrivning -->
        <div class="form-group">
          <label class="label">Beskrivning (valfritt)</label>
          <textarea
            v-model="form.description"
            class="input textarea"
            placeholder="Kort beskrivning av quizet..."
            rows="2"
          ></textarea>
        </div>

        <!-- Frågeväljare -->
        <div class="form-group">
          <label class="label">Frågor i quiz *</label>
          <div class="question-selector">
            <div class="selector-header">
              <div class="search-box">
                <input
                  v-model="searchQuery"
                  type="text"
                  class="input small"
                  placeholder="Sök frågor..."
                />
              </div>
              <div class="filter-group">
                <select v-model="filterCategory" class="input small">
                  <option value="">Alla kategorier</option>
                  <option v-for="cat in categories" :key="cat" :value="cat">
                    {{ cat }}
                  </option>
                </select>
              </div>
            </div>

            <div class="questions-pool">
              <h4>Tillgängliga frågor ({{ filteredAvailableQuestions.length }})</h4>
              <div class="questions-list available">
                <div v-if="isLoadingQuestions" class="loading-small">
                  <div class="loading-spinner-small"></div>
                  <span>Laddar frågor...</span>
                </div>
                <div v-else-if="filteredAvailableQuestions.length === 0" class="empty-list">
                  Inga tillgängliga frågor
                </div>
                <div
                  v-else
                  v-for="question in filteredAvailableQuestions"
                  :key="question.id"
                  class="question-item"
                  @click="addQuestion(question)"
                >
                  <div class="question-content">
                    <div class="question-title">{{ question.question }}</div>
                    <div class="question-meta">
                      <span class="badge">{{ question.category }}</span>
                      <span class="badge">{{ question.difficulty }}</span>
                    </div>
                  </div>
                  <button type="button" class="add-btn">+</button>
                </div>
              </div>
            </div>

            <div class="questions-selected">
              <h4>Valda frågor ({{ form.selectedQuestions.length }})</h4>
              <div class="questions-list selected">
                <div v-if="form.selectedQuestions.length === 0" class="empty-list">
                  Inga frågor valda än. Välj minst en fråga.
                </div>
                <draggable
                  v-else
                  v-model="form.selectedQuestions"
                  item-key="id"
                  class="draggable-list"
                  handle=".drag-handle"
                >
                  <template #item="{ element, index }">
                    <div class="question-item selected-item">
                      <div class="drag-handle">☰</div>
                      <div class="question-number">{{ index + 1 }}</div>
                      <div class="question-content">
                        <div class="question-title">{{ element.question }}</div>
                        <div class="question-meta">
                          <span class="badge">{{ element.category }}</span>
                          <span class="badge">{{ element.difficulty }}</span>
                        </div>
                      </div>
                      <button type="button" class="remove-btn" @click="removeQuestion(index)">
                        ✕
                      </button>
                    </div>
                  </template>
                </draggable>
              </div>
            </div>
          </div>
          <small class="helper-text">
            💡 Dra och släpp för att ändra ordning på frågorna
          </small>
        </div>

        <!-- Form-åtgärder -->
        <div class="form-actions">
          <button type="button" class="button secondary" @click="closeModal">
            Avbryt
          </button>
          <button 
            type="submit" 
            class="button"
            :disabled="!form.name || form.selectedQuestions.length === 0 || isSaving"
          >
            {{ isSaving ? 'Sparar...' : (isEditing ? 'Uppdatera quiz' : 'Skapa quiz') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, inject } from 'vue'
import draggable from 'vuedraggable'
import apiService from '../services/api'

export default {
  name: 'QuizFormModal',
  components: {
    draggable
  },
  props: {
    quiz: {
      type: Object,
      default: null
    }
  },
  emits: ['close', 'saved'],
  setup(props, { emit }) {
    const showToast = inject('showToast')

    // Reaktiv state
    const isEditing = computed(() => !!props.quiz)
    const isSaving = ref(false)
    const isLoadingQuestions = ref(false)
    const allQuestions = ref([])
    const searchQuery = ref('')
    const filterCategory = ref('')

    const form = ref({
      name: '',
      description: '',
      selectedQuestions: []
    })

    // Computed
    const categories = computed(() => {
      const cats = [...new Set(allQuestions.value.map(q => q.category).filter(Boolean))]
      return cats.sort()
    })

    const availableQuestions = computed(() => {
      const selectedIds = form.value.selectedQuestions.map(q => q.id)
      return allQuestions.value.filter(q => !selectedIds.includes(q.id))
    })

    const filteredAvailableQuestions = computed(() => {
      let filtered = availableQuestions.value

      // Textfilter
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(q => 
          q.question.toLowerCase().includes(query)
        )
      }

      // Kategorifilter
      if (filterCategory.value) {
        filtered = filtered.filter(q => q.category === filterCategory.value)
      }

      return filtered
    })

    /**
     * Ladda alla frågor
     */
    async function loadQuestions() {
      isLoadingQuestions.value = true
      try {
        const response = await apiService.getAllQuestions()
        allQuestions.value = response.data || []
      } catch (error) {
        console.error('Kunde inte ladda frågor:', error)
        showToast('Kunde inte ladda frågor', 'error')
      } finally {
        isLoadingQuestions.value = false
      }
    }

    /**
     * Ladda quiz-data om vi redigerar
     */
    async function loadQuizData() {
      if (!props.quiz) return

      form.value.name = props.quiz.name
      form.value.description = props.quiz.description || ''

      try {
        const response = await apiService.getQuizQuestions(props.quiz.id)
        form.value.selectedQuestions = response.data || []
      } catch (error) {
        console.error('Kunde inte ladda quiz-frågor:', error)
        showToast('Kunde inte ladda quiz-frågor', 'error')
      }
    }

    /**
     * Lägg till fråga
     */
    function addQuestion(question) {
      form.value.selectedQuestions.push(question)
    }

    /**
     * Ta bort fråga
     */
    function removeQuestion(index) {
      form.value.selectedQuestions.splice(index, 1)
    }

    /**
     * Spara quiz
     */
    async function saveQuiz() {
      if (!form.value.name || form.value.selectedQuestions.length === 0) {
        showToast('Fyll i quiz-namn och välj minst en fråga', 'warning')
        return
      }

      isSaving.value = true

      try {
        const quizData = {
          name: form.value.name,
          description: form.value.description || null,
          questionIds: form.value.selectedQuestions.map(q => q.id)
        }

        let response
        if (isEditing.value) {
          response = await apiService.updateQuiz(props.quiz.id, quizData)
        } else {
          response = await apiService.createQuiz(quizData)
        }

        emit('saved', response.data)
        showToast(isEditing.value ? 'Quiz uppdaterat' : 'Quiz skapat', 'success')
      } catch (error) {
        console.error('Kunde inte spara quiz:', error)
        showToast('Kunde inte spara quiz', 'error')
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

    // Ladda data vid mount
    onMounted(async () => {
      await loadQuestions()
      if (isEditing.value) {
        await loadQuizData()
      }
    })

    return {
      isEditing,
      isSaving,
      isLoadingQuestions,
      form,
      searchQuery,
      filterCategory,
      categories,
      filteredAvailableQuestions,
      addQuestion,
      removeQuestion,
      saveQuiz,
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
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-content.large {
  max-width: 1000px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.modal-header h3 {
  margin: 0;
  color: #374151;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0.5rem;
  border-radius: 0.25rem;
  transition: background 0.3s ease;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.quiz-form {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.form-group {
  margin-bottom: 1.5rem;
}

.label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: all 0.3s ease;
}

.input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.input.small {
  padding: 0.5rem;
  font-size: 0.875rem;
}

.textarea {
  resize: vertical;
  font-family: inherit;
}

.helper-text {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.question-selector {
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 0.5rem;
  overflow: hidden;
}

.selector-header {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.02);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.search-box {
  flex: 2;
}

.filter-group {
  flex: 1;
}

.questions-pool,
.questions-selected {
  padding: 1rem;
}

.questions-pool h4,
.questions-selected h4 {
  margin: 0 0 1rem 0;
  color: #374151;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.questions-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 0.5rem;
  padding: 0.5rem;
}

.questions-list.available {
  background: rgba(102, 126, 234, 0.02);
}

.questions-list.selected {
  background: rgba(16, 185, 129, 0.02);
}

.question-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.question-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.question-item.selected-item {
  cursor: default;
}

.question-item.selected-item:hover {
  transform: none;
}

.drag-handle {
  cursor: move;
  color: #6b7280;
  font-size: 1.2rem;
  padding: 0.25rem;
}

.question-number {
  background: #667eea;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: bold;
  flex-shrink: 0;
}

.question-content {
  flex: 1;
}

.question-title {
  color: #374151;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
  line-height: 1.3;
}

.question-meta {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.badge {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.7rem;
  font-weight: 500;
}

.add-btn,
.remove-btn {
  background: #667eea;
  color: white;
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.add-btn:hover {
  background: #5568d3;
  transform: scale(1.1);
}

.remove-btn {
  background: #ef4444;
}

.remove-btn:hover {
  background: #dc2626;
  transform: scale(1.1);
}

.empty-list {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.loading-small {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.loading-spinner-small {
  width: 20px;
  height: 20px;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.draggable-list {
  display: flex;
  flex-direction: column;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  margin-top: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .selector-header {
    flex-direction: column;
  }

  .questions-list {
    max-height: 200px;
  }
}
</style>
