<template>
  <div class="game-control">
    <div class="control-grid">
      <!-- Spelstatus -->
      <div class="status-section">
        <h3>🎮 Spelstatus</h3>
        <div class="status-card" :class="{ active: gameState.isActive }">
          <div class="status-indicator">
            <div class="indicator-dot"></div>
            <span v-if="gameState.isActive">Spel aktivt</span>
            <span v-else>Spel inaktivt</span>
          </div>
          
          <div v-if="gameState.currentQuestion" class="current-question">
            <strong>Aktuell fråga:</strong>
            <p>{{ gameState.currentQuestion.question }}</p>
            <div class="question-timer">
              Tid kvar: {{ gameState.timeLeft }}s
            </div>
          </div>
        </div>

        <div class="game-actions">
          <button 
            v-if="!gameState.isActive"
            class="button success"
            :disabled="players.length === 0"
            @click="$emit('start-game')"
          >
            🚀 Starta spel
          </button>
          
          <button 
            v-if="gameState.isActive && gameState.currentQuestion"
            class="button"
            @click="$emit('end-question')"
          >
            ⏹️ Avsluta fråga
          </button>
          
          <button 
            v-if="gameState.isActive"
            class="button danger"
            @click="confirmEndGame"
          >
            🏁 Avsluta spel
          </button>
        </div>
      </div>

      <!-- Anslutna spelare -->
      <div class="players-section">
        <h3>👥 Anslutna spelare ({{ players.length }})</h3>
        
        <div v-if="players.length === 0" class="no-players">
          <div class="empty-state">
            <div class="empty-icon">👤</div>
            <p>Inga spelare anslutna än</p>
            <small>Spelare kan gå med på huvudsidan</small>
          </div>
        </div>

        <div v-else class="players-list">
          <div 
            v-for="player in sortedPlayers" 
            :key="player.name"
            class="player-item"
          >
            <div class="player-info">
              <div class="player-avatar">
                {{ getPlayerEmoji(player.name) }}
              </div>
              <div class="player-details">
                <div class="player-name">{{ player.name }}</div>
                <div class="player-score">{{ player.score }} poäng</div>
              </div>
            </div>
            <div class="player-status">
              <div class="connection-indicator connected"></div>
              <span class="status-text">Online</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Live svar-status -->
      <div v-if="gameState.currentQuestion" class="answers-monitor">
        <h3>📊 Live svar-status</h3>
        
        <div class="answer-progress">
          <div class="progress-header">
            <span>{{ liveAnswers.length }} av {{ players.length }} har svarat</span>
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: answerProgress + '%' }"
              ></div>
            </div>
          </div>
        </div>

        <div class="live-answers-list">
          <div 
            v-for="player in playersWithAnswerStatus" 
            :key="player.name"
            class="live-answer-item"
            :class="{ 
              answered: player.hasAnswered, 
              'not-answered': !player.hasAnswered 
            }"
          >
            <div class="player-info">
              <div class="player-avatar">
                {{ getPlayerEmoji(player.name) }}
              </div>
              <div class="player-name">{{ player.name }}</div>
            </div>
            
            <div class="answer-status">
              <div v-if="player.hasAnswered" class="answered-info">
                <div class="answer-given">{{ player.answer }}</div>
                <div class="response-time">{{ formatResponseTime(player.responseTime) }}</div>
              </div>
              <div v-else class="waiting-status">
                <div class="waiting-dot"></div>
                <span>Väntar...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Frågeväljare -->
    <div class="question-selector">
      <h3>❓ Frågehantering</h3>
      
      <div class="selector-actions">
        <button 
          class="button"
          :disabled="!gameState.isActive || gameState.currentQuestion"
          @click="showRandomQuestion"
        >
          🎲 Visa slumpmässig fråga
        </button>
        
        <button 
          class="button secondary"
          @click="showQuestionModal = true"
        >
          📋 Välj specifik fråga
        </button>
      </div>

      <!-- Quick stats -->
      <div class="quick-stats">
        <div class="stat-item">
          <span class="stat-label">Totalt frågor:</span>
          <span class="stat-value">{{ totalQuestions }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Spelare svarade:</span>
          <span class="stat-value">{{ playersAnswered }} / {{ players.length }}</span>
        </div>
      </div>
    </div>

    <!-- Modal för frågeväljare -->
    <QuestionSelectorModal 
      v-if="showQuestionModal"
      @close="showQuestionModal = false"
      @question-selected="handleQuestionSelected"
    />

    <!-- Bekräftelsedialog för att avsluta spel -->
    <ConfirmDialog 
      v-if="showEndGameConfirm"
      title="Avsluta spel"
      message="Är du säker på att du vill avsluta spelet? Alla poäng kommer att nollställas."
      confirm-text="Avsluta spel"
      @confirm="handleEndGame"
      @cancel="showEndGameConfirm = false"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import apiService from '../services/api'
import QuestionSelectorModal from './QuestionSelectorModal.vue'
import ConfirmDialog from './ConfirmDialog.vue'

export default {
  name: 'GameControl',
  components: {
    QuestionSelectorModal,
    ConfirmDialog
  },
  props: {
    players: {
      type: Array,
      default: () => []
    },
    gameState: {
      type: Object,
      default: () => ({
        isActive: false,
        currentQuestion: null,
        timeLeft: 0
      })
    }
  },
  emits: ['start-game', 'show-question', 'end-question', 'end-game'],
  setup(props, { emit }) {
    const showQuestionModal = ref(false)
    const showEndGameConfirm = ref(false)
    const totalQuestions = ref(0)
    const playersAnswered = ref(0)
    const liveAnswers = ref([]) // Array med live svar som kommer in

    // Computed
    const sortedPlayers = computed(() => {
      return [...props.players].sort((a, b) => b.score - a.score)
    })

    // Beräkna svar-progress
    const answerProgress = computed(() => {
      if (props.players.length === 0) return 0
      return Math.round((liveAnswers.value.length / props.players.length) * 100)
    })

    // Kombinera spelare med deras svar-status
    const playersWithAnswerStatus = computed(() => {
      return props.players.map(player => {
        const answer = liveAnswers.value.find(a => a.playerName === player.name)
        return {
          ...player,
          hasAnswered: !!answer,
          answer: answer?.answer || null,
          responseTime: answer?.responseTime || null
        }
      })
    })

    /**
     * Ladda initial data
     */
    onMounted(async () => {
      try {
        const response = await apiService.getAllQuestions()
        totalQuestions.value = response.data?.length || 0
      } catch (error) {
        console.error('Kunde inte ladda frågor:', error)
      }
    })

    /**
     * Generera emoji för spelare
     */
    function getPlayerEmoji(name) {
      const emojis = ['🐱', '🐶', '🦊', '🐻', '🐼', '🐨', '🐸', '🦁', '🐯', '🐰']
      const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
      return emojis[index % emojis.length]
    }

    /**
     * Visa slumpmässig fråga
     */
    async function showRandomQuestion() {
      try {
        const response = await apiService.getRandomQuestions(1)
        if (response.data && response.data.length > 0) {
          const question = response.data[0]
          
          // Hämta komplett fråga med rätt svar för admin
          const fullQuestion = await apiService.getQuestionById(question.id)
          
          emit('show-question', {
            id: fullQuestion.data.id,
            question: fullQuestion.data.question,
            options: {
              A: fullQuestion.data.option_a,
              B: fullQuestion.data.option_b,
              C: fullQuestion.data.option_c,
              D: fullQuestion.data.option_d
            },
            correctAnswer: fullQuestion.data.correct_answer,
            timeLimit: fullQuestion.data.time_limit,
            category: fullQuestion.data.category,
            difficulty: fullQuestion.data.difficulty,
            image_url: fullQuestion.data.image_url
          })
        }
      } catch (error) {
        console.error('Kunde inte hämta slumpmässig fråga:', error)
      }
    }

    /**
     * Hantera vald fråga från modal
     */
    function handleQuestionSelected(question) {
      emit('show-question', question)
      showQuestionModal.value = false
    }

    /**
     * Bekräfta avslutning av spel
     */
    function confirmEndGame() {
      showEndGameConfirm.value = true
    }

    /**
     * Hantera avslutning av spel
     */
    function handleEndGame() {
      emit('end-game')
      showEndGameConfirm.value = false
    }

    /**
     * Formatera svarstid till läsbar text
     */
    function formatResponseTime(responseTime) {
      if (!responseTime) return 'Svarade'
      
      const seconds = Math.round(responseTime / 1000 * 10) / 10
      
      if (seconds < 1) {
        return `⚡ ${Math.round(responseTime)}ms`
      } else if (seconds < 2) {
        return `🚀 ${seconds}s`
      } else if (seconds < 5) {
        return `⏱️ ${seconds}s`
      } else {
        return `🐌 ${seconds}s`
      }
    }

    /**
     * Hantera inkommande svar från spelare
     */
    function handlePlayerAnswer(answerData) {
      // Ta bort eventuellt tidigare svar från samma spelare
      const existingIndex = liveAnswers.value.findIndex(a => a.playerName === answerData.playerName)
      if (existingIndex >= 0) {
        liveAnswers.value.splice(existingIndex, 1)
      }
      
      // Lägg till det nya svaret
      liveAnswers.value.push(answerData)
      playersAnswered.value = liveAnswers.value.length
    }

    /**
     * Rensa live svar när ny fråga startar
     */
    function clearLiveAnswers() {
      liveAnswers.value = []
      playersAnswered.value = 0
    }

    return {
      showQuestionModal,
      showEndGameConfirm,
      totalQuestions,
      playersAnswered,
      liveAnswers,
      sortedPlayers,
      answerProgress,
      playersWithAnswerStatus,
      getPlayerEmoji,
      showRandomQuestion,
      handleQuestionSelected,
      confirmEndGame,
      handleEndGame,
      formatResponseTime,
      handlePlayerAnswer,
      clearLiveAnswers
    }
  }
}
</script>

<style scoped>
.game-control {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.control-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.status-section,
.players-section,
.answers-monitor {
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 1rem;
  padding: 1.5rem;
}

.status-section h3,
.players-section h3,
.answers-monitor h3 {
  color: #374151;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.status-card {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 0.75rem;
  padding: 1rem;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
}

.status-card.active {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.2);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  font-weight: 500;
}

.indicator-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #ef4444;
  animation: pulse 2s infinite;
}

.status-card.active .indicator-dot {
  background: #10b981;
  animation: none;
}

.current-question {
  padding-top: 1rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.current-question p {
  color: #374151;
  margin: 0.5rem 0;
  font-style: italic;
}

.question-timer {
  color: #f59e0b;
  font-weight: bold;
  font-size: 0.9rem;
}

.game-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.no-players {
  padding: 2rem 0;
}

.empty-state {
  text-align: center;
  color: #6b7280;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.players-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 300px;
  overflow-y: auto;
}

.player-item {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 0.5rem;
  padding: 0.75rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.player-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.player-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(102, 126, 234, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.player-name {
  font-weight: 600;
  color: #374151;
}

.player-score {
  font-size: 0.875rem;
  color: #6b7280;
}

.player-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.connection-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
}

.status-text {
  font-size: 0.75rem;
  color: #10b981;
  font-weight: 500;
}

.question-selector {
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 1rem;
  padding: 1.5rem;
}

.question-selector h3 {
  color: #374151;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.selector-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.quick-stats {
  display: flex;
  gap: 2rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.stat-value {
  font-weight: bold;
  color: #374151;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Live svar-monitor */
.answers-monitor {
  margin-top: 1rem;
}

.answer-progress {
  margin-bottom: 1.5rem;
}

.progress-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #f59e0b, #10b981);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.live-answers-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 300px;
  overflow-y: auto;
}

.live-answer-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  border-radius: 0.5rem;
  transition: all 0.3s ease;
}

.live-answer-item.answered {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.live-answer-item.not-answered {
  background: rgba(107, 114, 128, 0.1);
  border: 1px solid rgba(107, 114, 128, 0.2);
}

.live-answer-item .player-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.live-answer-item .player-avatar {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  background: rgba(102, 126, 234, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
}

.live-answer-item .player-name {
  font-weight: 600;
  color: #374151;
}

.answer-status {
  text-align: right;
}

.answered-info .answer-given {
  font-weight: bold;
  color: #059669;
  margin-bottom: 0.25rem;
}

.answered-info .response-time {
  font-size: 0.875rem;
  color: #6b7280;
}

.waiting-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  font-style: italic;
}

.waiting-dot {
  width: 8px;
  height: 8px;
  background: #f59e0b;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@media (max-width: 768px) {
  .control-grid {
    grid-template-columns: 1fr;
  }

  .selector-actions {
    flex-direction: column;
  }

  .quick-stats {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>