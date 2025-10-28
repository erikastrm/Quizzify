<template>
  <div class="question-result">
    <div class="card">
      <!-- Loading state -->
      <div v-if="!result" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Laddar resultat...</p>
      </div>

      <!-- Resultat innehåll -->
      <div v-else>
        <!-- Resultat-header -->
        <div class="result-header">
          <h2>📊 Frågeresultat</h2>
          <div v-if="result && result.correctAnswer" class="correct-answer">
            Rätt svar: <strong>{{ result.correctAnswer }}</strong>
          </div>
        </div>

      <!-- Statistik -->
      <div v-if="result && result.correctCount !== undefined" class="result-stats">
        <div class="stat-card">
          <div class="stat-number">{{ result.correctCount }}</div>
          <div class="stat-label">Rätt svar</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ result.totalCount - result.correctCount }}</div>
          <div class="stat-label">Fel svar</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ Math.round((result.correctCount / result.totalCount) * 100) }}%</div>
          <div class="stat-label">Andel rätt</div>
        </div>
      </div>

      <!-- Spelarnas svar -->
      <div v-if="result && result.answers && result.answers.length > 0" class="answers-section">
        <h3>Spelarnas svar</h3>
        <div class="answers-list">
          <div 
            v-for="answer in sortedAnswers" 
            :key="answer.playerName"
            class="answer-item"
            :class="{ correct: answer.isCorrect, incorrect: !answer.isCorrect }"
          >
            <div class="answer-player">
              <div class="player-avatar">
                {{ getPlayerEmoji(answer.playerName) }}
              </div>
              <div class="player-name">{{ answer.playerName }}</div>
            </div>
            
            <div class="answer-details">
              <div class="answer-given">
                Svar: <strong>{{ answer.answer }}</strong>
              </div>
              <div class="answer-stats">
                <div class="answer-time">
                  {{ formatResponseTime(answer.responseTime) }}
                </div>
                <div v-if="answer.isCorrect" class="answer-points">
                  +{{ answer.pointsEarned }} poäng
                </div>
              </div>
            </div>

            <div class="answer-result">
              <div v-if="answer.isCorrect" class="result-icon correct">
                ✓
              </div>
              <div v-else class="result-icon incorrect">
                ✗
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Uppdaterade poäng -->
      <div class="scores-section">
        <h3>Nuvarande ställning</h3>
        <div class="scores-list">
          <div 
            v-for="(player, index) in sortedScores" 
            :key="player.name"
            class="score-item"
            :class="{ 'is-leader': index === 0 }"
          >
            <div class="score-position">{{ index + 1 }}</div>
            <div class="score-player">
              <div class="player-avatar">
                {{ getPlayerEmoji(player.name) }}
              </div>
              <div class="player-name">{{ player.name }}</div>
            </div>
            <div class="score-points">{{ player.score }} poäng</div>
          </div>
        </div>
      </div>

        <!-- Väntar på nästa fråga -->
        <div class="waiting-next">
          <div class="pulse-dot"></div>
          <span>Väntar på nästa fråga...</span>
        </div>
      </div>
    </div>
  </div>
</template><script>
import { computed } from 'vue'

export default {
  name: 'QuestionResult',
  props: {
    result: {
      type: Object,
      required: false,
      default: null
    },
    currentScores: {
      type: Array,
      default: () => []
    }
  },
  setup(props) {
    /**
     * Sortera svar efter tid (snabbast först)
     */
    const sortedAnswers = computed(() => {
      if (!props.result || !props.result.answers) {
        return []
      }
      return [...props.result.answers].sort((a, b) => a.timestamp - b.timestamp)
    })

    /**
     * Sortera poäng efter högst poäng
     */
    const sortedScores = computed(() => {
      if (!props.currentScores || !Array.isArray(props.currentScores)) {
        return []
      }
      return [...props.currentScores].sort((a, b) => b.score - a.score)
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
     * Formatera svarstid till läsbar text
     */
    function formatResponseTime(responseTime) {
      if (!responseTime) return 'Svarade'
      
      const seconds = Math.round(responseTime / 1000 * 10) / 10 // Avrunda till 1 decimal
      
      if (seconds < 1) {
        return `Blixtsnabbt! (${Math.round(responseTime)}ms)`
      } else if (seconds < 2) {
        return `Supersnabbt! (${seconds}s)`
      } else if (seconds < 5) {
        return `Snabbt (${seconds}s)`
      } else {
        return `Svarade på ${seconds}s`
      }
    }

    /**
     * Formatera timestamp till relativ tid
     */
    function formatTimestamp(timestamp) {
      // Backup funktion om responseTime inte finns
      return 'Svarade'
    }

    return {
      sortedAnswers,
      sortedScores,
      getPlayerEmoji,
      formatResponseTime,
      formatTimestamp
    }
  }
}
</script>

<style scoped>
.question-result {
  max-width: 900px;
  margin: 0 auto;
}

.loading-state {
  text-align: center;
  padding: 3rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(102, 126, 234, 0.1);
  border-left: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-state p {
  color: #6b7280;
  font-size: 1.1rem;
}

.result-header {
  text-align: center;
  margin-bottom: 2rem;
}

.result-header h2 {
  color: #667eea;
  font-size: 1.8rem;
  margin-bottom: 1rem;
}

.correct-answer {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  padding: 0.75rem 1.5rem;
  border-radius: 2rem;
  font-size: 1.1rem;
  display: inline-block;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.result-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 1rem;
  padding: 1.5rem;
  text-align: center;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #6b7280;
  font-size: 0.9rem;
  font-weight: 500;
}

.answers-section,
.scores-section {
  margin-bottom: 2rem;
}

.answers-section h3,
.scores-section h3 {
  color: #374151;
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

.answers-list,
.scores-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.answer-item {
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 0.75rem;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.answer-item.correct {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.3);
}

.answer-item.incorrect {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
}

.answer-player,
.score-player {
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

.answer-details {
  flex: 2;
  text-align: center;
}

.answer-given {
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.answer-stats {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.answer-time {
  font-size: 0.875rem;
  color: #6b7280;
}

.answer-points {
  font-size: 0.875rem;
  font-weight: 600;
  color: #059669;
  background: rgba(16, 185, 129, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  display: inline-block;
}

.answer-result {
  flex: 0 0 auto;
}

.result-icon {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
}

.result-icon.correct {
  background: #10b981;
}

.result-icon.incorrect {
  background: #ef4444;
}

.score-item {
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 0.75rem;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.score-item.is-leader {
  background: rgba(255, 215, 0, 0.1);
  border-color: rgba(255, 215, 0, 0.3);
}

.score-position {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #667eea;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex: 0 0 auto;
}

.score-item.is-leader .score-position {
  background: #ffd700;
  color: #333;
}

.score-points {
  font-weight: bold;
  color: #667eea;
  flex: 0 0 auto;
}

.waiting-next {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1.5rem;
  color: #6b7280;
  font-style: italic;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.pulse-dot {
  width: 12px;
  height: 12px;
  background: #f59e0b;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
}

@media (max-width: 768px) {
  .result-stats {
    grid-template-columns: repeat(3, 1fr);
  }

  .stat-card {
    padding: 1rem;
  }

  .stat-number {
    font-size: 1.5rem;
  }

  .answer-item,
  .score-item {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }

  .answer-details {
    order: -1;
  }
}
</style>