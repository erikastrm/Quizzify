<template>
  <div class="player-view">
    <!-- Formulär för att gå med i spelet -->
    <JoinForm 
      v-if="gamePhase === 'join'" 
      @player-joined="handlePlayerJoined"
    />

    <!-- Väntar på att spelet ska starta -->
    <WaitingRoom 
      v-else-if="gamePhase === 'waiting'"
      :players="players"
      :player-name="playerName"
    />

    <!-- Aktiv quiz-fråga -->
    <QuizQuestion 
      v-else-if="gamePhase === 'question'"
      :question="currentQuestion"
      :time-left="timeLeft"
      @answer-submitted="handleAnswerSubmitted"
    />

    <!-- Resultat efter fråga -->
    <QuestionResult 
      v-else-if="gamePhase === 'result' && questionResult"
      :result="questionResult"
      :current-scores="players"
    />

    <!-- Slutligt scoreboard -->
    <FinalScoreboard 
      v-else-if="gamePhase === 'finished'"
      :final-scores="finalScores"
      :winner="winner"
      @play-again="resetGame"
    />

    <!-- Anslutningsstatus -->
    <div class="connection-status" :class="{ connected: isConnected }">
      <div class="status-indicator"></div>
      {{ isConnected ? 'Ansluten' : 'Inte ansluten' }}
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, inject } from 'vue'
import socketService from '../services/socket'
import JoinForm from '../components/JoinForm.vue'
import WaitingRoom from '../components/WaitingRoom.vue'
import QuizQuestion from '../components/QuizQuestion.vue'
import QuestionResult from '../components/QuestionResult.vue'
import FinalScoreboard from '../components/FinalScoreboard.vue'

export default {
  name: 'PlayerView',
  components: {
    JoinForm,
    WaitingRoom,
    QuizQuestion,
    QuestionResult,
    FinalScoreboard
  },
  setup() {
    const showToast = inject('showToast')

    // Reaktiv state
    const gamePhase = ref('join') // join, waiting, question, result, finished
    const isConnected = ref(false)
    const playerName = ref('')
    const playerId = ref('')
    const players = ref([])
    const currentQuestion = ref(null)
    const timeLeft = ref(0)
    const questionResult = ref(null)
    const finalScores = ref([])
    const winner = ref(null)

    /**
     * Anslut till Socket.IO-servern när komponenten monteras
     */
    onMounted(() => {
      // Anslut till servern
      const socket = socketService.connect()
      
      // Lyssna på anslutningsstatus
      socket.on('connect', () => {
        isConnected.value = true
      })

      socket.on('disconnect', () => {
        isConnected.value = false
        showToast('Anslutning tappad', 'error')
      })

      // Lyssna på spel-events
      setupSocketListeners()
    })

    /**
     * Rensa Socket.IO-lyssnare när komponenten förstörs
     */
    onUnmounted(() => {
      socketService.disconnect()
    })

    /**
     * Konfigurera alla Socket.IO-lyssnare
     */
    function setupSocketListeners() {
      // Lyckad anslutning som spelare
      socketService.on('join_success', (data) => {
        playerId.value = data.playerId
        playerName.value = data.playerName
        gamePhase.value = 'waiting'
        showToast(`Välkommen ${data.playerName}!`, 'success')
      })

      // Fel vid anslutning
      socketService.on('join_error', (message) => {
        showToast(message, 'error')
      })

      // Uppdaterad spellista
      socketService.on('players_updated', (playerList) => {
        players.value = playerList
      })

      // Spelet har startats
      socketService.on('game_started', () => {
        gamePhase.value = 'waiting'
        showToast('Spelet har startats!', 'info')
      })

      // Ny fråga visas
      socketService.on('question_shown', (question) => {
        currentQuestion.value = question
        gamePhase.value = 'question'
        timeLeft.value = question.timeLimit || 30
      })

      // Timer-uppdatering
      socketService.on('timer_update', (time) => {
        timeLeft.value = time
      })

      // Svar bekräftat
      socketService.on('answer_submitted', () => {
        showToast('Svar skickat!', 'success')
      })

      // Frågeresultat
      socketService.on('question_results', (result) => {
        questionResult.value = result
        gamePhase.value = 'result'
      })

      // Uppdaterade poäng
      socketService.on('scores_updated', (playerList) => {
        players.value = playerList
      })

      // Spelet avslutat
      socketService.on('game_ended', (data) => {
        finalScores.value = data.finalScores
        winner.value = data.winner
        gamePhase.value = 'finished'
        showToast('Spelet är slut!', 'info')
      })

      // Spelstatus (för återanslutning)
      socketService.on('game_status', (status) => {
        if (status.isActive && status.currentQuestion) {
          currentQuestion.value = status.currentQuestion
          timeLeft.value = status.timeLeft
          gamePhase.value = 'question'
        }
      })

      // Allmänna fel
      socketService.on('error', (message) => {
        showToast(message, 'error')
      })
    }

    /**
     * Hantera när spelare går med i spelet
     */
    function handlePlayerJoined(name) {
      if (!socketService.isConnected()) {
        showToast('Inte ansluten till servern', 'error')
        return
      }

      // Skicka join-event till servern
      socketService.emit('player_join', name)
    }

    /**
     * Hantera när spelare skickar svar
     */
    function handleAnswerSubmitted(answer) {
      if (!currentQuestion.value) {
        showToast('Ingen aktiv fråga', 'error')
        return
      }

      // Skicka svar till servern
      socketService.emit('submit_answer', {
        questionId: currentQuestion.value.id,
        answer: answer
      })
    }

    /**
     * Återställ spelet för att spela igen
     */
    function resetGame() {
      gamePhase.value = 'waiting'
      currentQuestion.value = null
      questionResult.value = null
      finalScores.value = []
      winner.value = null
      timeLeft.value = 0
    }

    return {
      gamePhase,
      isConnected,
      playerName,
      players,
      currentQuestion,
      timeLeft,
      questionResult,
      finalScores,
      winner,
      handlePlayerJoined,
      handleAnswerSubmitted,
      resetGame
    }
  }
}
</script>

<style scoped>
.player-view {
  max-width: 800px;
  margin: 0 auto;
  position: relative;
}

.connection-status {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 2rem;
  font-size: 0.875rem;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.connection-status.connected {
  color: #10b981;
}

.connection-status:not(.connected) {
  color: #ef4444;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
  animation: pulse 2s infinite;
}

.connection-status.connected .status-indicator {
  animation: none;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@media (max-width: 768px) {
  .connection-status {
    bottom: 1rem;
    right: 1rem;
    font-size: 0.75rem;
    padding: 0.375rem 0.75rem;
  }
}
</style>