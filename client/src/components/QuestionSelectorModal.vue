<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>Välj fråga</h3>
        <button class="close-btn" @click="closeModal">✕</button>
      </div>

      <div class="modal-body">
        <!-- Sökfilter -->
        <div class="filters-section">
          <div class="filter-group">
            <input
              v-model="searchQuery"
              type="text"
              class="input"
              placeholder="Sök frågor..."
            />
          </div>
          <div class="filter-group">
            <select v-model="selectedCategory" class="input">
              <option value="">Alla kategorier</option>
              <option v-for="category in categories" :key="category" :value="category">
                {{ category }}
              </option>
            </select>
          </div>
        </div>

        <!-- Fråglista -->
        <div v-if="isLoading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>Laddar frågor...</p>
        </div>

        <div v-else-if="filteredQuestions.length === 0" class="empty-state">
          <p>Inga frågor hittades</p>
        </div>

        <div v-else class="questions-list">
          <div 
            v-for="question in filteredQuestions" 
            :key="question.id"
            class="question-item"
            @click="selectQuestion(question)"
          >
            <div class="question-header">
              <div class="question-meta">
                <span class="category-badge">{{ question.category }}</span>
                <span class="difficulty-badge" :class="question.difficulty">
                  {{ getDifficultyText(question.difficulty) }}
                </span>
              </div>
              <span class="time-limit">⏱️ {{ question.time_limit }}s</span>
            </div>
            
            <div class="question-text">
              {{ question.question }}
            </div>
            
            <div class="question-preview">
              <div class="options-preview">
                <span>A: {{ question.option_a }}</span>
                <span>B: {{ question.option_b }}</span>
                <span>C: {{ question.option_c }}</span>
                <span>D: {{ question.option_d }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, inject } from 'vue'
import apiService from '../services/api'

export default {
  name: 'QuestionSelectorModal',
  emits: ['close', 'question-selected'],
  setup(props, { emit }) {
    const showToast = inject('showToast')

    // Reaktiv state
    const questions = ref([])
    const isLoading = ref(false)
    const searchQuery = ref('')
    const selectedCategory = ref('')

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

      return filtered.slice(0, 20) // Begränsa till 20 frågor för prestanda
    })

    /**
     * Ladda frågor
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
     * Välj fråga
     */
    function selectQuestion(question) {
      // Skapa fullständig frågedata för admin
      const fullQuestion = {
        id: question.id,
        question: question.question,
        options: {
          A: question.option_a,
          B: question.option_b,
          C: question.option_c,
          D: question.option_d
        },
        correctAnswer: question.correct_answer,
        timeLimit: question.time_limit,
        category: question.category,
        difficulty: question.difficulty,
        image_url: question.image_url
      }

      emit('question-selected', fullQuestion)
    }

    /**
     * Stäng modal
     */
    function closeModal() {
      emit('close')
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

    // Ladda frågor vid mount
    onMounted(() => {
      loadQuestions()
    })

    return {
      questions,
      isLoading,
      searchQuery,
      selectedCategory,
      categories,
      filteredQuestions,
      selectQuestion,
      closeModal,
      getDifficultyText
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
  max-width: 700px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
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

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.filters-section {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.loading-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.question-item {
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.question-item:hover {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.05);
  transform: translateY(-2px);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
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

.time-limit {
  font-size: 0.875rem;
  color: #6b7280;
}

.question-text {
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.75rem;
  line-height: 1.4;
}

.question-preview {
  border-top: 1px solid #e5e7eb;
  padding-top: 0.75rem;
}

.options-preview {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.options-preview span {
  padding: 0.25rem 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .modal-content {
    max-height: 90vh;
  }

  .filters-section {
    grid-template-columns: 1fr;
  }

  .options-preview {
    grid-template-columns: 1fr;
  }

  .question-header {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }
}
</style>