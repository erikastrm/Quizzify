<template>
  <div class="admin-view">
    <!-- Inloggningsformulär om inte inloggad -->
    <AdminLogin 
      v-if="!isAuthenticated" 
      @login-success="handleLoginSuccess"
    />

    <!-- Admin-panel om inloggad -->
    <div v-else class="admin-panel">
      <!-- Admin-header -->
      <div class="admin-header">
        <div class="header-content">
          <h1>🛠️ Admin Panel</h1>
          <div class="admin-info">
            Inloggad som: <strong>{{ adminUser.username }}</strong>
          </div>
        </div>
        <button class="button secondary" @click="logout">
          Logga ut
        </button>
      </div>

      <!-- Tab-navigation -->
      <div class="tab-navigation">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          class="tab-button"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.icon }} {{ tab.name }}
        </button>
      </div>

      <!-- Tab-innehåll -->
      <div class="tab-content">
        <!-- Spelkontroll -->
        <GameControl 
          v-if="activeTab === 'game'"
          ref="gameControlRef"
          :players="players"
          :game-state="gameState"
          @start-game="startGame"
          @show-question="showQuestion"
          @end-question="endQuestion"
          @end-game="endGame"
        />

        <!-- Frågehantering -->
        <QuestionManager 
          v-if="activeTab === 'questions'"
        />

        <!-- Spelhistorik -->
        <GameHistory 
          v-if="activeTab === 'history'"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, inject } from 'vue'
import socketService from '../services/socket'
import apiService from '../services/api'
import AdminLogin from '../components/AdminLogin.vue'
import GameControl from '../components/GameControl.vue'
import QuestionManager from '../components/QuestionManager.vue'
import GameHistory from '../components/GameHistory.vue'

export default {
  name: 'AdminView',
  components: {
    AdminLogin,
    GameControl,
    QuestionManager,
    GameHistory
  },
  setup() {
    const showToast = inject('showToast')

    // Reaktiv state
    const isAuthenticated = ref(false)
    const adminUser = ref({ username: '' })
    const activeTab = ref('game')
    const players = ref([])
    const gameState = ref({
      isActive: false,
      currentQuestion: null,
      timeLeft: 0
    })
    const gameControlRef = ref(null)

    // Tab-konfiguration
    const tabs = ref([
      { id: 'game', name: 'Spelkontroll', icon: '🎮' },
      { id: 'questions', name: 'Frågor', icon: '❓' },
      { id: 'history', name: 'Historik', icon: '📊' }
    ])

    /**
     * Kontrollera autentisering vid mount
     */
    onMounted(async () => {
      try {
        const authStatus = await apiService.getAuthStatus()
        if (authStatus.isAuthenticated) {
          isAuthenticated.value = true
          adminUser.value = authStatus.data
          initializeAdminConnection()
        }
      } catch (error) {
        console.error('Fel vid auth-kontroll:', error)
      }
    })

    /**
     * Rensa anslutning vid unmount
     */
    onUnmounted(() => {
      socketService.disconnect()
    })

    /**
     * Initiera admin-anslutning till Socket.IO
     */
    function initializeAdminConnection() {
      const socket = socketService.connect()
      
      // Hämta initial spelstatus
      socket.emit('get_game_state')
      
      // Lyssna på spel-events
      setupAdminSocketListeners()
    }

    /**
     * Konfigurera Socket.IO-lyssnare för admin
     */
    function setupAdminSocketListeners() {
      // Uppdaterad spellista
      socketService.on('players_updated', (playerList) => {
        players.value = playerList
      })

      // Spelstatus
      socketService.on('game_state', (state) => {
        gameState.value = state
        players.value = state.players || []
      })

      // Spelare svarade
      socketService.on('player_answered', (data) => {
        showToast(`${data.playerName} har svarat`, 'info')
        
        // Skicka data till GameControl komponenten för live-visning
        if (gameControlRef.value) {
          gameControlRef.value.handlePlayerAnswer(data)
        }
      })

      // Timer-uppdatering
      socketService.on('timer_update', (time) => {
        gameState.value.timeLeft = time
      })

      // Fel
      socketService.on('error', (message) => {
        showToast(message, 'error')
      })
    }

    /**
     * Hantera lyckad inloggning
     */
    function handleLoginSuccess(userData) {
      isAuthenticated.value = true
      adminUser.value = userData
      initializeAdminConnection()
      showToast('Inloggning lyckades', 'success')
    }

    /**
     * Logga ut admin
     */
    async function logout() {
      try {
        await apiService.logout()
        isAuthenticated.value = false
        adminUser.value = { username: '' }
        socketService.disconnect()
        showToast('Utloggad', 'info')
      } catch (error) {
        console.error('Fel vid utloggning:', error)
        showToast('Fel vid utloggning', 'error')
      }
    }

    /**
     * Starta spelet
     */
    function startGame() {
      if (players.value.length === 0) {
        showToast('Inga spelare anslutna', 'warning')
        return
      }

      socketService.emit('start_game')
      showToast('Spelet startat', 'success')
    }

    /**
     * Visa fråga för spelare
     */
    function showQuestion(question) {
      if (!gameState.value.isActive) {
        showToast('Spelet är inte aktivt', 'warning')
        return
      }

      // Rensa tidigare live svar när ny fråga visas
      if (gameControlRef.value) {
        gameControlRef.value.clearLiveAnswers()
      }

      socketService.emit('show_question', question)
      showToast('Fråga visad för spelare', 'success')
    }

    /**
     * Avsluta aktuell fråga
     */
    function endQuestion() {
      socketService.emit('end_question')
      showToast('Fråga avslutad', 'info')
    }

    /**
     * Avsluta hela spelet
     */
    function endGame() {
      socketService.emit('end_game')
      showToast('Spelet avslutat', 'info')
    }

    return {
      isAuthenticated,
      adminUser,
      activeTab,
      tabs,
      players,
      gameState,
      gameControlRef,
      handleLoginSuccess,
      logout,
      startGame,
      showQuestion,
      endQuestion,
      endGame
    }
  }
}
</script>

<style scoped>
.admin-view {
  max-width: 1200px;
  margin: 0 auto;
}

.admin-panel {
  min-height: 80vh;
}

.admin-header {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.header-content h1 {
  color: #667eea;
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
}

.admin-info {
  color: #6b7280;
  font-size: 0.95rem;
}

.tab-navigation {
  display: flex;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 1rem;
  padding: 0.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.tab-button {
  flex: 1;
  background: transparent;
  border: none;
  padding: 1rem;
  border-radius: 0.75rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #6b7280;
}

.tab-button:hover {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.tab-button.active {
  background: #667eea;
  color: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.tab-content {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  min-height: 500px;
}

@media (max-width: 768px) {
  .admin-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .tab-navigation {
    flex-direction: column;
    gap: 0.5rem;
  }

  .tab-content {
    padding: 1.5rem;
  }
}
</style>