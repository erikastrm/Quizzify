<template>
  <div class="game-history">
    <div class="history-header">
      <h3>📊 Spelhistorik</h3>
      <button class="button secondary" @click="loadHistory">
        🔄 Uppdatera
      </button>
    </div>

    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>Laddar historik...</p>
    </div>

    <div v-else-if="sessions.length === 0" class="empty-state">
      <div class="empty-icon">📈</div>
      <h4>Ingen spelhistorik</h4>
      <p>Inga avslutade spel att visa än</p>
    </div>

    <div v-else class="history-content">
      <!-- Statistik-översikt -->
      <div class="stats-overview">
        <div class="stat-card">
          <div class="stat-number">{{ sessions.length }}</div>
          <div class="stat-label">Totalt spel</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ totalPlayers }}</div>
          <div class="stat-label">Totalt spelare</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ averagePlayersPerGame }}</div>
          <div class="stat-label">Snitt spelare/spel</div>
        </div>
      </div>

      <!-- Sessionslista -->
      <div class="sessions-list">
        <div 
          v-for="session in sessions" 
          :key="session.id"
          class="session-card"
        >
          <div class="session-header">
            <div class="session-info">
              <h4>Spel #{{ session.id }}</h4>
              <div class="session-date">
                {{ formatDate(session.started_at) }}
              </div>
            </div>
            <div class="session-stats">
              <span class="session-duration">
                {{ getSessionDuration(session) }}
              </span>
              <span class="session-players">
                👥 {{ session.total_players }}
              </span>
            </div>
          </div>

          <div v-if="session.winner_name" class="session-winner">
            <div class="winner-badge">
              <span class="crown">👑</span>
              <span class="winner-info">
                <strong>{{ session.winner_name }}</strong>
                vann med {{ session.winner_score }} poäng
              </span>
            </div>
          </div>

          <div class="session-details">
            <div class="detail-item">
              <span class="detail-label">Frågor:</span>
              <span class="detail-value">{{ session.total_questions || 'Okänt' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Startad:</span>
              <span class="detail-value">{{ formatTime(session.started_at) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Avslutad:</span>
              <span class="detail-value">{{ formatTime(session.ended_at) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, inject } from 'vue'

export default {
  name: 'GameHistory',
  setup() {
    const showToast = inject('showToast')

    // Reaktiv state
    const sessions = ref([])
    const isLoading = ref(false)

    // Computed properties
    const totalPlayers = computed(() => {
      return sessions.value.reduce((sum, session) => sum + (session.total_players || 0), 0)
    })

    const averagePlayersPerGame = computed(() => {
      if (sessions.value.length === 0) return 0
      return Math.round(totalPlayers.value / sessions.value.length)
    })

    /**
     * Ladda spelhistorik
     * Eftersom vi inte implementerat backend för historik än,
     * simulerar vi data här
     */
    async function loadHistory() {
      isLoading.value = true
      
      try {
        // Simulerad data - i verkligheten skulle detta komma från API
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        sessions.value = [
          {
            id: 1,
            started_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            ended_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString(),
            total_players: 5,
            total_questions: 10,
            winner_name: 'Anna',
            winner_score: 85
          },
          {
            id: 2,
            started_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            ended_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 12 * 60 * 1000).toISOString(),
            total_players: 3,
            total_questions: 8,
            winner_name: 'Erik',
            winner_score: 70
          },
          {
            id: 3,
            started_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            ended_at: new Date(Date.now() - 6 * 60 * 60 * 1000 + 20 * 60 * 1000).toISOString(),
            total_players: 8,
            total_questions: 15,
            winner_name: 'Maria',
            winner_score: 120
          }
        ]
        
        showToast('Historik uppdaterad', 'success')
      } catch (error) {
        console.error('Kunde inte ladda historik:', error)
        showToast('Kunde inte ladda historik', 'error')
      } finally {
        isLoading.value = false
      }
    }

    /**
     * Formatera datum
     */
    function formatDate(dateString) {
      const date = new Date(dateString)
      const now = new Date()
      const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
      
      if (diffDays === 0) return 'Idag'
      if (diffDays === 1) return 'Igår'
      if (diffDays < 7) return `${diffDays} dagar sedan`
      
      return date.toLocaleDateString('sv-SE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }

    /**
     * Formatera tid
     */
    function formatTime(dateString) {
      const date = new Date(dateString)
      return date.toLocaleTimeString('sv-SE', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    /**
     * Beräkna speltid
     */
    function getSessionDuration(session) {
      if (!session.ended_at) return 'Pågående'
      
      const start = new Date(session.started_at)
      const end = new Date(session.ended_at)
      const diffMinutes = Math.round((end - start) / (1000 * 60))
      
      if (diffMinutes < 60) {
        return `${diffMinutes} min`
      } else {
        const hours = Math.floor(diffMinutes / 60)
        const minutes = diffMinutes % 60
        return `${hours}h ${minutes}m`
      }
    }

    // Ladda historik vid mount
    onMounted(() => {
      loadHistory()
    })

    return {
      sessions,
      isLoading,
      totalPlayers,
      averagePlayersPerGame,
      loadHistory,
      formatDate,
      formatTime,
      getSessionDuration
    }
  }
}
</script>

<style scoped>
.game-history {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.history-header h3 {
  color: #374151;
  font-size: 1.2rem;
  margin: 0;
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

.stats-overview {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 0.75rem;
  padding: 1rem;
  text-align: center;
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

.sessions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.session-card {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 0.75rem;
  padding: 1rem;
  transition: all 0.3s ease;
}

.session-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.session-info h4 {
  color: #374151;
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
}

.session-date {
  color: #6b7280;
  font-size: 0.875rem;
}

.session-stats {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: flex-end;
  font-size: 0.875rem;
  color: #6b7280;
}

.session-winner {
  margin-bottom: 1rem;
}

.winner-badge {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 237, 78, 0.1));
  border: 1px solid rgba(255, 215, 0, 0.3);
  border-radius: 0.5rem;
  padding: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.crown {
  font-size: 1.2rem;
}

.winner-info {
  color: #92400e;
  font-size: 0.9rem;
}

.session-details {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-label {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  font-weight: 500;
}

.detail-value {
  font-size: 0.875rem;
  color: #374151;
  font-weight: 500;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .history-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .stats-overview {
    grid-template-columns: 1fr;
  }

  .session-header {
    flex-direction: column;
    gap: 1rem;
  }

  .session-stats {
    align-items: flex-start;
  }

  .session-details {
    grid-template-columns: 1fr;
  }
}
</style>