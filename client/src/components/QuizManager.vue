<template>
  <div class="quiz-manager">
    <!-- Header med åtgärder -->
    <div class="manager-header">
      <h3>🎯 Quiz-hantering</h3>
      <button class="button" @click="showCreateModal = true">
        ➕ Nytt quiz
      </button>
    </div>

    <!-- Statistik -->
    <div class="stats-section">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">{{ quizzes.length }}</div>
          <div class="stat-label">Totalt quiz</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ totalQuestions }}</div>
          <div class="stat-label">Totalt frågor i quiz</div>
        </div>
      </div>
    </div>

    <!-- Quiz-lista -->
    <div class="quizzes-section">
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Laddar quiz...</p>
      </div>

      <div v-else-if="quizzes.length === 0" class="empty-state">
        <div class="empty-icon">🎯</div>
        <h4>Inga quiz hittades</h4>
        <p>Skapa ditt första quiz för att komma igång</p>
        <button class="button" @click="showCreateModal = true">
          ➕ Skapa quiz
        </button>
      </div>

      <div v-else class="quizzes-list">
        <div 
          v-for="quiz in quizzes" 
          :key="quiz.id"
          class="quiz-card"
        >
          <div class="quiz-header">
            <div class="quiz-info">
              <h4>{{ quiz.name }}</h4>
              <p v-if="quiz.description" class="quiz-description">{{ quiz.description }}</p>
            </div>
            <div class="quiz-actions">
              <button class="action-btn edit" @click="editQuiz(quiz)" title="Redigera">
                ✏️
              </button>
              <button class="action-btn view" @click="viewQuizQuestions(quiz)" title="Visa frågor">
                👁️
              </button>
              <button class="action-btn delete" @click="confirmDelete(quiz)" title="Ta bort">
                🗑️
              </button>
            </div>
          </div>

          <div class="quiz-meta">
            <div class="meta-item">
              <span class="meta-icon">❓</span>
              <span>{{ quiz.question_count }} frågor</span>
            </div>
            <div class="meta-item">
              <span class="meta-icon">📅</span>
              <span>{{ formatDate(quiz.created_at) }}</span>
            </div>
          </div>

          <div class="quiz-footer">
            <button 
              class="button secondary small"
              @click="$emit('start-quiz', quiz)"
              :disabled="quiz.question_count === 0"
            >
              🚀 Starta quiz
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal för att visa quiz-frågor -->
    <div v-if="viewingQuiz" class="modal-overlay" @click="viewingQuiz = null">
      <div class="modal-content large" @click.stop>
        <div class="modal-header">
          <h3>{{ viewingQuiz.name }} - Frågor</h3>
          <button class="close-btn" @click="viewingQuiz = null">✕</button>
        </div>
        <div class="modal-body">
          <div v-if="loadingQuestions" class="loading-state">
            <div class="loading-spinner"></div>
            <p>Laddar frågor...</p>
          </div>
          <div v-else-if="quizQuestions.length === 0" class="empty-state">
            <p>Inga frågor i detta quiz</p>
          </div>
          <div v-else class="questions-preview-list">
            <div 
              v-for="(question, index) in quizQuestions" 
              :key="question.id"
              class="question-preview-item"
            >
              <div class="question-number">{{ index + 1 }}</div>
              <div class="question-preview-content">
                <div class="question-text">{{ question.question }}</div>
                <div class="question-preview-meta">
                  <span class="meta-badge">{{ question.category }}</span>
                  <span class="meta-badge">{{ question.difficulty }}</span>
                  <span class="meta-badge">⏱️ {{ question.time_limit }}s</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="button secondary" @click="viewingQuiz = null">Stäng</button>
        </div>
      </div>
    </div>

    <!-- Modaler -->
    <QuizFormModal 
      v-if="showCreateModal || editingQuiz"
      :quiz="editingQuiz"
      @close="closeModals"
      @saved="handleQuizSaved"
    />

    <ConfirmDialog 
      v-if="quizToDelete"
      title="Ta bort quiz"
      :message="`Är du säker på att du vill ta bort quizet: ${quizToDelete.name}?`"
      confirm-text="Ta bort"
      @confirm="handleDeleteQuiz"
      @cancel="quizToDelete = null"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted, inject } from 'vue'
import apiService from '../services/api'
import QuizFormModal from './QuizFormModal.vue'
import ConfirmDialog from './ConfirmDialog.vue'

export default {
  name: 'QuizManager',
  components: {
    QuizFormModal,
    ConfirmDialog
  },
  emits: ['start-quiz'],
  setup(props, { emit }) {
    const showToast = inject('showToast')

    // Reaktiv state
    const quizzes = ref([])
    const isLoading = ref(false)
    const showCreateModal = ref(false)
    const editingQuiz = ref(null)
    const quizToDelete = ref(null)
    const viewingQuiz = ref(null)
    const quizQuestions = ref([])
    const loadingQuestions = ref(false)

    // Computed
    const totalQuestions = computed(() => {
      return quizzes.value.reduce((sum, quiz) => sum + (quiz.question_count || 0), 0)
    })

    /**
     * Ladda alla quiz
     */
    async function loadQuizzes() {
      isLoading.value = true
      try {
        const response = await apiService.getAllQuizzes()
        quizzes.value = response.data || []
      } catch (error) {
        console.error('Kunde inte ladda quiz:', error)
        showToast('Kunde inte ladda quiz', 'error')
      } finally {
        isLoading.value = false
      }
    }

    /**
     * Visa quiz-frågor
     */
    async function viewQuizQuestions(quiz) {
      viewingQuiz.value = quiz
      loadingQuestions.value = true
      quizQuestions.value = []
      
      try {
        const response = await apiService.getQuizQuestions(quiz.id)
        quizQuestions.value = response.data || []
      } catch (error) {
        console.error('Kunde inte ladda quiz-frågor:', error)
        showToast('Kunde inte ladda frågor', 'error')
      } finally {
        loadingQuestions.value = false
      }
    }

    /**
     * Redigera quiz
     */
    function editQuiz(quiz) {
      editingQuiz.value = quiz
    }

    /**
     * Bekräfta borttagning
     */
    function confirmDelete(quiz) {
      quizToDelete.value = quiz
    }

    /**
     * Ta bort quiz
     */
    async function handleDeleteQuiz() {
      if (!quizToDelete.value) return

      try {
        await apiService.deleteQuiz(quizToDelete.value.id)
        quizzes.value = quizzes.value.filter(q => q.id !== quizToDelete.value.id)
        showToast('Quiz borttaget', 'success')
      } catch (error) {
        console.error('Kunde inte ta bort quiz:', error)
        showToast('Kunde inte ta bort quiz', 'error')
      } finally {
        quizToDelete.value = null
      }
    }

    /**
     * Hantera sparat quiz
     */
    function handleQuizSaved(savedQuiz) {
      if (editingQuiz.value) {
        // Uppdatera befintligt quiz
        const index = quizzes.value.findIndex(q => q.id === savedQuiz.id)
        if (index !== -1) {
          quizzes.value[index] = savedQuiz
        }
      } else {
        // Lägg till nytt quiz
        quizzes.value.unshift(savedQuiz)
      }
      
      closeModals()
      showToast('Quiz sparat', 'success')
    }

    /**
     * Stäng modaler
     */
    function closeModals() {
      showCreateModal.value = false
      editingQuiz.value = null
    }

    /**
     * Formatera datum
     */
    function formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString('sv-SE')
    }

    // Ladda data vid mount
    onMounted(() => {
      loadQuizzes()
    })

    return {
      quizzes,
      isLoading,
      totalQuestions,
      showCreateModal,
      editingQuiz,
      quizToDelete,
      viewingQuiz,
      quizQuestions,
      loadingQuestions,
      viewQuizQuestions,
      editQuiz,
      confirmDelete,
      handleDeleteQuiz,
      handleQuizSaved,
      closeModals,
      formatDate
    }
  }
}
</script>

<style scoped>
.quiz-manager {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.manager-header h3 {
  color: #374151;
  font-size: 1.2rem;
  margin: 0;
}

.stats-section {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 0.75rem;
  padding: 1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.stat-card {
  text-align: center;
  padding: 1rem;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 0.5rem;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.quizzes-section {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 0.75rem;
  padding: 1rem;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: #6b7280;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.quizzes-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.quiz-card {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 0.75rem;
  padding: 1.25rem;
  transition: all 0.3s ease;
}

.quiz-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.quiz-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.quiz-info h4 {
  color: #374151;
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
}

.quiz-description {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
  font-style: italic;
}

.quiz-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  background: transparent;
  border: none;
  padding: 0.5rem;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.3s ease;
}

.action-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.quiz-meta {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.meta-icon {
  font-size: 1rem;
}

.quiz-footer {
  display: flex;
  justify-content: flex-end;
}

.button.small {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

/* Modal */
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
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-content.large {
  max-width: 800px;
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

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.questions-preview-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.question-preview-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 0.5rem;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.question-number {
  background: #667eea;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
}

.question-preview-content {
  flex: 1;
}

.question-text {
  color: #374151;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.question-preview-meta {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.meta-badge {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .manager-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .quiz-header {
    flex-direction: column;
    gap: 1rem;
  }

  .quiz-meta {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
