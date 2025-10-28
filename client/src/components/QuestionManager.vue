<template>
  <div class="question-manager">
    <!-- Header med åtgärder -->
    <div class="manager-header">
      <h3>❓ Frågehantering</h3>
      <button class="button" @click="showCreateModal = true">
        ➕ Ny fråga
      </button>
    </div>

    <!-- Sökfilter -->
    <div class="filters-section">
      <div class="filters-grid">
        <div class="filter-group">
          <label class="label">Sök frågor</label>
          <input
            v-model="searchQuery"
            type="text"
            class="input"
            placeholder="Sök i frågor..."
          />
        </div>
        
        <div class="filter-group">
          <label class="label">Kategori</label>
          <select v-model="selectedCategory" class="input">
            <option value="">Alla kategorier</option>
            <option v-for="category in categories" :key="category" :value="category">
              {{ category }}
            </option>
          </select>
        </div>
        
        <div class="filter-group">
          <label class="label">Svårighetsgrad</label>
          <select v-model="selectedDifficulty" class="input">
            <option value="">Alla svårigheter</option>
            <option value="easy">Lätt</option>
            <option value="medium">Medel</option>
            <option value="hard">Svår</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Statistik -->
    <div class="stats-section">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">{{ questions.length }}</div>
          <div class="stat-label">Totalt frågor</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ filteredQuestions.length }}</div>
          <div class="stat-label">Visas nu</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ categories.length }}</div>
          <div class="stat-label">Kategorier</div>
        </div>
      </div>
    </div>

    <!-- Fråglista -->
    <div class="questions-section">
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Laddar frågor...</p>
      </div>

      <div v-else-if="filteredQuestions.length === 0" class="empty-state">
        <div class="empty-icon">❓</div>
        <h4>{{ questions.length === 0 ? 'Inga frågor hittades' : 'Inga frågor matchar filtren' }}</h4>
        <p>{{ questions.length === 0 ? 'Skapa din första fråga för att komma igång' : 'Försök ändra sökfilter' }}</p>
      </div>

      <div v-else class="questions-list">
        <div 
          v-for="question in paginatedQuestions" 
          :key="question.id"
          class="question-card"
        >
          <div class="question-header">
            <div class="question-meta">
              <span class="category-badge">{{ question.category }}</span>
              <span class="difficulty-badge" :class="question.difficulty">
                {{ getDifficultyText(question.difficulty) }}
              </span>
            </div>
            <div class="question-actions">
              <button class="action-btn edit" @click="editQuestion(question)">
                ✏️
              </button>
              <button class="action-btn delete" @click="confirmDelete(question)">
                🗑️
              </button>
            </div>
          </div>

          <div class="question-content">
            <h4>{{ question.question }}</h4>
            <div class="question-options">
              <div class="option" :class="{ correct: question.correct_answer === 'A' }">
                <strong>A:</strong> {{ question.option_a }}
              </div>
              <div class="option" :class="{ correct: question.correct_answer === 'B' }">
                <strong>B:</strong> {{ question.option_b }}
              </div>
              <div class="option" :class="{ correct: question.correct_answer === 'C' }">
                <strong>C:</strong> {{ question.option_c }}
              </div>
              <div class="option" :class="{ correct: question.correct_answer === 'D' }">
                <strong>D:</strong> {{ question.option_d }}
              </div>
            </div>
          </div>

          <div class="question-footer">
            <span class="time-limit">⏱️ {{ question.time_limit }}s</span>
            <span class="created-date">{{ formatDate(question.created_at) }}</span>
          </div>
        </div>
      </div>

      <!-- Paginering -->
      <div v-if="totalPages > 1" class="pagination">
        <button 
          class="button secondary"
          :disabled="currentPage === 1"
          @click="currentPage--"
        >
          ← Föregående
        </button>
        
        <span class="page-info">
          Sida {{ currentPage }} av {{ totalPages }}
        </span>
        
        <button 
          class="button secondary"
          :disabled="currentPage === totalPages"
          @click="currentPage++"
        >
          Nästa →
        </button>
      </div>
    </div>

    <!-- Modaler -->
    <QuestionFormModal 
      v-if="showCreateModal || editingQuestion"
      :question="editingQuestion"
      @close="closeModals"
      @saved="handleQuestionSaved"
    />

    <ConfirmDialog 
      v-if="questionToDelete"
      title="Ta bort fråga"
      :message="`Är du säker på att du vill ta bort frågan: ${questionToDelete.question}?`"
      confirm-text="Ta bort"
      @confirm="handleDeleteQuestion"
      @cancel="questionToDelete = null"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted, inject } from 'vue'
import apiService from '../services/api'
import QuestionFormModal from './QuestionFormModal.vue'
import ConfirmDialog from './ConfirmDialog.vue'

export default {
  name: 'QuestionManager',
  components: {
    QuestionFormModal,
    ConfirmDialog
  },
  setup() {
    const showToast = inject('showToast')

    // Reaktiv state
    const questions = ref([])
    const isLoading = ref(false)
    const searchQuery = ref('')
    const selectedCategory = ref('')
    const selectedDifficulty = ref('')
    const currentPage = ref(1)
    const questionsPerPage = 5
    const showCreateModal = ref(false)
    const editingQuestion = ref(null)
    const questionToDelete = ref(null)

    // Computed
    const categories = computed(() => {
      const cats = [...new Set(questions.value.map(q => q.category).filter(Boolean))]
      return cats.sort()
    })

    const filteredQuestions = computed(() => {
      let filtered = questions.value

      // Textfilter
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(q => 
          q.question.toLowerCase().includes(query) ||
          q.option_a.toLowerCase().includes(query) ||
          q.option_b.toLowerCase().includes(query) ||
          q.option_c.toLowerCase().includes(query) ||
          q.option_d.toLowerCase().includes(query)
        )
      }

      // Kategorifilter
      if (selectedCategory.value) {
        filtered = filtered.filter(q => q.category === selectedCategory.value)
      }

      // Svårighetsfilter
      if (selectedDifficulty.value) {
        filtered = filtered.filter(q => q.difficulty === selectedDifficulty.value)
      }

      return filtered
    })

    const totalPages = computed(() => {
      return Math.ceil(filteredQuestions.value.length / questionsPerPage)
    })

    const paginatedQuestions = computed(() => {
      const start = (currentPage.value - 1) * questionsPerPage
      const end = start + questionsPerPage
      return filteredQuestions.value.slice(start, end)
    })

    /**
     * Ladda alla frågor
     */
    async function loadQuestions() {
      isLoading.value = true
      try {
        const response = await apiService.getAllQuestions()
        questions.value = response.data || []
      } catch (error) {
        console.error('Kunde inte ladda frågor:', error)
        showToast('Kunde inte ladda frågor', 'error')
      } finally {
        isLoading.value = false
      }
    }

    /**
     * Redigera fråga
     */
    function editQuestion(question) {
      editingQuestion.value = question
    }

    /**
     * Bekräfta borttagning
     */
    function confirmDelete(question) {
      questionToDelete.value = question
    }

    /**
     * Ta bort fråga
     */
    async function handleDeleteQuestion() {
      if (!questionToDelete.value) return

      try {
        await apiService.deleteQuestion(questionToDelete.value.id)
        questions.value = questions.value.filter(q => q.id !== questionToDelete.value.id)
        showToast('Fråga borttagen', 'success')
      } catch (error) {
        console.error('Kunde inte ta bort fråga:', error)
        showToast('Kunde inte ta bort fråga', 'error')
      } finally {
        questionToDelete.value = null
      }
    }

    /**
     * Hantera sparad fråga
     */
    function handleQuestionSaved(savedQuestion) {
      if (editingQuestion.value) {
        // Uppdatera befintlig fråga
        const index = questions.value.findIndex(q => q.id === savedQuestion.id)
        if (index !== -1) {
          questions.value[index] = savedQuestion
        }
      } else {
        // Lägg till ny fråga
        questions.value.unshift(savedQuestion)
      }
      
      closeModals()
      showToast('Fråga sparad', 'success')
    }

    /**
     * Stäng modaler
     */
    function closeModals() {
      showCreateModal.value = false
      editingQuestion.value = null
    }

    /**
     * Formatera datum
     */
    function formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString('sv-SE')
    }

    /**
     * Hämta svårighetstext
     */
    function getDifficultyText(difficulty) {
      const texts = {
        easy: 'Lätt',
        medium: 'Medel',
        hard: 'Svår'
      }
      return texts[difficulty] || difficulty
    }

    // Ladda data vid mount
    onMounted(() => {
      loadQuestions()
    })

    return {
      questions,
      isLoading,
      searchQuery,
      selectedCategory,
      selectedDifficulty,
      currentPage,
      categories,
      filteredQuestions,
      totalPages,
      paginatedQuestions,
      showCreateModal,
      editingQuestion,
      questionToDelete,
      editQuestion,
      confirmDelete,
      handleDeleteQuestion,
      handleQuestionSaved,
      closeModals,
      formatDate,
      getDifficultyText
    }
  }
}
</script>

<style scoped>
.question-manager {
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

.filters-section {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 0.75rem;
  padding: 1rem;
}

.filters-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 1rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stats-section {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 0.75rem;
  padding: 1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
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

.questions-section {
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

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.question-card {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 0.75rem;
  padding: 1rem;
  transition: all 0.3s ease;
}

.question-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.question-meta {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.category-badge {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.difficulty-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.difficulty-badge.easy {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.difficulty-badge.medium {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.difficulty-badge.hard {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.question-actions {
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

.question-content h4 {
  color: #374151;
  margin-bottom: 1rem;
  font-size: 1rem;
  line-height: 1.4;
}

.question-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.option {
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

.option.correct {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.question-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  font-size: 0.875rem;
  color: #6b7280;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
}

.page-info {
  color: #6b7280;
  font-size: 0.875rem;
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

  .filters-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .question-options {
    grid-template-columns: 1fr;
  }

  .question-footer {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }
}
</style>