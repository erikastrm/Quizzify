<template>
  <div class="waiting-room">
    <div class="card">
      <div class="waiting-header">
        <h2>⏳ Väntar på att spelet ska starta</h2>
        <p>Spelledaren kommer starta spelet när alla är redo</p>
      </div>

      <div class="player-info">
        <div class="current-player">
          <span class="player-badge">Du</span>
          {{ playerName }}
        </div>
      </div>

      <div class="players-section">
        <h3>Anslutna spelare ({{ players.length }})</h3>
        
        <div v-if="players.length === 0" class="no-players">
          <div class="loading-spinner"></div>
          <p>Laddar spelare...</p>
        </div>

        <div v-else class="players-grid">
          <div 
            v-for="player in players" 
            :key="player.name"
            class="player-card"
            :class="{ 'is-you': player.name === playerName }"
          >
            <div class="player-avatar">
              {{ getPlayerEmoji(player.name) }}
            </div>
            <div class="player-details">
              <div class="player-name">{{ player.name }}</div>
              <div class="player-score">{{ player.score }} poäng</div>
            </div>
            <div v-if="player.name === playerName" class="you-indicator">
              Du
            </div>
          </div>
        </div>
      </div>

      <div class="waiting-info">
        <div class="info-box">
          <h4>🎮 Vad händer nu?</h4>
          <ul>
            <li>Spelledaren ser alla anslutna spelare</li>
            <li>När tillräckligt många är anslutna startas spelet</li>
            <li>Du får automatiskt se frågorna när de visas</li>
            <li>Svara så snabbt och korrekt som möjligt!</li>
          </ul>
        </div>
      </div>

      <div class="status-indicator">
        <div class="pulse-dot"></div>
        <span>Väntar på spelledaren...</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'WaitingRoom',
  props: {
    players: {
      type: Array,
      default: () => []
    },
    playerName: {
      type: String,
      required: true
    }
  },
  setup() {
    /**
     * Generera en emoji baserat på spelarens namn
     */
    function getPlayerEmoji(name) {
      const emojis = ['🐱', '🐶', '🦊', '🐻', '🐼', '🐨', '🐸', '🦁', '🐯', '🐰']
      const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
      return emojis[index % emojis.length]
    }

    return {
      getPlayerEmoji
    }
  }
}
</script>

<style scoped>
.waiting-room {
  max-width: 800px;
  margin: 0 auto;
}

.waiting-header {
  text-align: center;
  margin-bottom: 2rem;
}

.waiting-header h2 {
  color: #667eea;
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
}

.waiting-header p {
  color: #6b7280;
  font-size: 1.1rem;
}

.player-info {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 0.75rem;
  padding: 1rem;
  margin-bottom: 2rem;
  text-align: center;
}

.current-player {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  font-size: 1.1rem;
  font-weight: 500;
  color: #10b981;
}

.player-badge {
  background: #10b981;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 600;
}

.players-section {
  margin-bottom: 2rem;
}

.players-section h3 {
  color: #374151;
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

.no-players {
  text-align: center;
  padding: 2rem;
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

.players-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.player-card {
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 0.75rem;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s ease;
  position: relative;
}

.player-card.is-you {
  background: rgba(16, 185, 129, 0.1);
  border-color: rgba(16, 185, 129, 0.3);
}

.player-avatar {
  font-size: 2rem;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 50%;
}

.player-details {
  flex: 1;
}

.player-name {
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.25rem;
}

.player-score {
  font-size: 0.875rem;
  color: #6b7280;
}

.you-indicator {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #10b981;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.waiting-info {
  margin-bottom: 2rem;
}

.info-box {
  background: rgba(59, 130, 246, 0.05);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 0.75rem;
  padding: 1.5rem;
}

.info-box h4 {
  color: #3b82f6;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.info-box ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.info-box li {
  padding: 0.5rem 0;
  color: #4b5563;
  position: relative;
  padding-left: 1.5rem;
}

.info-box li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #3b82f6;
  font-weight: bold;
}

.status-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem;
  color: #6b7280;
  font-style: italic;
}

.pulse-dot {
  width: 12px;
  height: 12px;
  background: #f59e0b;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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
  .players-grid {
    grid-template-columns: 1fr;
  }

  .waiting-header h2 {
    font-size: 1.5rem;
  }

  .info-box {
    padding: 1rem;
  }
}
</style>