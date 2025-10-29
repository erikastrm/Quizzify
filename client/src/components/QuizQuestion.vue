<template>
  <div class="quiz-question">
    <div class="card">
      <!-- Quiz progress (om det är ett quiz) -->
      <div v-if="question.questionNumber && question.totalQuestions" class="quiz-progress">
        <div class="progress-text">
          Fråga {{ question.questionNumber }} av {{ question.totalQuestions }}
        </div>
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: (question.questionNumber / question.totalQuestions * 100) + '%' }"
          ></div>
        </div>
      </div>

      <!-- Timer och kategori -->
      <div class="question-header">
        <div class="timer" :class="{ urgent: timeLeft <= 5 }">
          <div class="timer-circle">
            <svg class="timer-svg" viewBox="0 0 100 100">
              <circle 
                cx="50" 
                cy="50" 
                r="45" 
                fill="none" 
                stroke="#e5e7eb" 
                stroke-width="8"
              />
              <circle 
                cx="50" 
                cy="50" 
                r="45" 
                fill="none" 
                stroke="currentColor" 
                stroke-width="8"
                stroke-linecap="round"
                :stroke-dasharray="circumference"
                :stroke-dashoffset="strokeDashoffset"
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div class="timer-text">{{ timeLeft }}</div>
          </div>
        </div>

        <div class="question-info">
          <div v-if="question.category" class="category-badge">
            {{ question.category }}
          </div>
          <div v-if="question.difficulty" class="difficulty-badge" :class="question.difficulty">
            {{ getDifficultyText(question.difficulty) }}
          </div>
        </div>
      </div>

      <!-- Frågan -->
      <div class="question-content">
        <h2 class="question-text">{{ question.question }}</h2>
      </div>

      <!-- Media (bild, ljud eller video) -->
      <div v-if="question.media_url && question.media_type && question.media_type !== 'none'" class="question-media">
        <!-- Bild -->
        <div v-if="question.media_type === 'image'" class="media-image">
          <img :src="getMediaUrl(question.media_url)" :alt="question.question" />
        </div>
        
        <!-- Ljud -->
        <div v-else-if="question.media_type === 'audio'" class="media-audio">
          <audio :src="getMediaUrl(question.media_url)" controls autoplay></audio>
        </div>
        
        <!-- Video -->
        <div v-else-if="question.media_type === 'video'" class="media-video">
          <video :src="getMediaUrl(question.media_url)" controls autoplay></video>
        </div>
      </div>

      <!-- Svarsalternativ -->
      <div class="answers-grid">
        <button
          v-for="(option, key) in question.options"
          :key="key"
          class="answer-button"
          :class="{ 
            selected: selectedAnswer === key,
            disabled: hasAnswered
          }"
          :disabled="hasAnswered || timeLeft <= 0"
          @click="selectAnswer(key)"
        >
          <div class="answer-label">{{ key }}</div>
          <div class="answer-text">{{ option }}</div>
        </button>
      </div>

      <!-- Skicka-knapp -->
      <div class="submit-section">
        <button
          class="button"
          :class="{ success: hasAnswered }"
          :disabled="!selectedAnswer || hasAnswered || timeLeft <= 0"
          @click="submitAnswer"
        >
          <span v-if="hasAnswered">✓ Svar skickat!</span>
          <span v-else-if="timeLeft <= 0">⏰ Tiden är ute</span>
          <span v-else-if="selectedAnswer">🚀 Skicka svar</span>
          <span v-else>Välj ett svar</span>
        </button>
      </div>

      <!-- Status -->
      <div v-if="hasAnswered" class="answer-status">
        <div class="status-icon">✓</div>
        <div class="status-text">
          Svar mottaget! Väntar på att alla ska svara...
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'

export default {
  name: 'QuizQuestion',
  props: {
    question: {
      type: Object,
      required: true
    },
    timeLeft: {
      type: Number,
      default: 30
    }
  },
  emits: ['answer-submitted'],
  setup(props, { emit }) {
    const selectedAnswer = ref('')
    const hasAnswered = ref(false)

    // Timer-beräkningar för SVG-cirkel
    const circumference = 2 * Math.PI * 45 // r=45
    const strokeDashoffset = computed(() => {
      const progress = props.timeLeft / (props.question.timeLimit || 30)
      return circumference * (1 - progress)
    })

    /**
     * Hämta media URL
     */
    function getMediaUrl(path) {
      if (!path) return ''
      if (path.startsWith('http')) return path
      return `http://localhost:3001${path}`
    }

    /**
     * Välj ett svar
     */
    function selectAnswer(key) {
      if (hasAnswered.value || props.timeLeft <= 0) return
      selectedAnswer.value = key
    }

    /**
     * Skicka svaret
     */
    function submitAnswer() {
      if (!selectedAnswer.value || hasAnswered.value || props.timeLeft <= 0) return
      
      hasAnswered.value = true
      emit('answer-submitted', selectedAnswer.value)
    }

    /**
     * Hämta svårighetsgrad-text
     */
    function getDifficultyText(difficulty) {
      const texts = {
        easy: 'Lätt',
        medium: 'Medel',
        hard: 'Svår'
      }
      return texts[difficulty] || difficulty
    }

    // Återställ state när ny fråga kommer
    watch(() => props.question, () => {
      selectedAnswer.value = ''
      hasAnswered.value = false
    })

    // Auto-submit när tiden tar slut
    watch(() => props.timeLeft, (newTime) => {
      if (newTime <= 0 && selectedAnswer.value && !hasAnswered.value) {
        submitAnswer()
      }
    })

    return {
      selectedAnswer,
      hasAnswered,
      circumference,
      strokeDashoffset,
      selectAnswer,
      submitAnswer,
      getDifficultyText,
      getMediaUrl
    }
  }
}
</script>

<style scoped>
.quiz-question {
  max-width: 900px;
  margin: 0 auto;
}

.quiz-progress {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.progress-text {
  text-align: center;
  font-weight: 600;
  color: #667eea;
  margin-bottom: 0.75rem;
  font-size: 1rem;
}

.progress-bar {
  height: 8px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #10b981);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.timer {
  position: relative;
  color: #10b981;
  transition: color 0.3s ease;
}

.timer.urgent {
  color: #ef4444;
  animation: pulse 1s infinite;
}

.timer-circle {
  position: relative;
  width: 80px;
  height: 80px;
}

.timer-svg {
  width: 100%;
  height: 100%;
}

.timer-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.5rem;
  font-weight: bold;
  color: currentColor;
}

.question-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-end;
}

.category-badge {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
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

.question-content {
  margin-bottom: 2rem;
}

.question-text {
  font-size: 1.5rem;
  color: #374151;
  line-height: 1.4;
  text-align: center;
}

.question-media {
  margin: 2rem auto;
  max-width: 600px;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.media-image {
  background: #f9fafb;
}

.media-image img {
  width: 100%;
  height: auto;
  max-height: 400px;
  object-fit: contain;
  display: block;
}

.media-audio {
  padding: 2rem;
  background: #f9fafb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.media-audio audio {
  width: 100%;
  max-width: 500px;
}

.media-video {
  background: #000;
}

.media-video video {
  width: 100%;
  height: auto;
  max-height: 400px;
  display: block;
}

/* Behåll bakåtkompatibilitet med gamla image_url */
.question-image {
  margin: 2rem auto;
  max-width: 600px;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.question-image img {
  width: 100%;
  height: auto;
  max-height: 400px;
  object-fit: contain;
  display: block;
  background: #f9fafb;
}

.answers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.answer-button {
  background: rgba(255, 255, 255, 0.8);
  border: 2px solid #e5e7eb;
  border-radius: 1rem;
  padding: 1.5rem;
  text-align: left;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.answer-button:hover:not(.disabled) {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.05);
  transform: translateY(-2px);
}

.answer-button.selected {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.1);
}

.answer-button.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.answer-label {
  background: #667eea;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.answer-button.selected .answer-label {
  background: #10b981;
}

.answer-text {
  font-size: 1.1rem;
  color: #374151;
  line-height: 1.3;
}

.submit-section {
  text-align: center;
  margin-bottom: 1rem;
}

.submit-section .button {
  font-size: 1.1rem;
  padding: 1rem 2rem;
  min-width: 200px;
}

.answer-status {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 0.75rem;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  color: #10b981;
}

.status-icon {
  font-size: 1.5rem;
}

.status-text {
  font-weight: 500;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@media (max-width: 768px) {
  .question-header {
    flex-direction: column;
    gap: 1rem;
    align-items: center;
  }

  .question-info {
    align-items: center;
  }

  .timer-circle {
    width: 60px;
    height: 60px;
  }

  .timer-text {
    font-size: 1.2rem;
  }

  .question-text {
    font-size: 1.3rem;
  }

  .answers-grid {
    grid-template-columns: 1fr;
  }

  .answer-button {
    padding: 1rem;
  }

  .answer-text {
    font-size: 1rem;
  }
}
</style>