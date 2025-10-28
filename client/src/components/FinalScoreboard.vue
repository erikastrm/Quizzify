<template>
  <div class="final-scoreboard">
    <div class="card">
      <!-- Spelslut-header -->
      <div class="game-over-header">
        <h1>🏁 Spelet är slut!</h1>
        <div v-if="winner" class="winner-announcement">
          <div class="winner-crown">👑</div>
          <div class="winner-text">
            <strong>{{ winner.name }}</strong> vinner med {{ winner.score }} poäng!
          </div>
        </div>
      </div>

      <!-- Slutlig scoreboard -->
      <div class="final-standings">
        <h2>🏆 Slutlig ställning</h2>
        <div class="podium-container">
          <!-- Podium för topp 3 -->
          <div v-if="finalScores.length >= 2" class="podium">
            <!-- 2:a plats -->
            <div v-if="finalScores[1]" class="podium-step second">
              <div class="podium-player">
                <div class="podium-avatar">
                  {{ getPlayerEmoji(finalScores[1].name) }}
                </div>
                <div class="podium-name">{{ finalScores[1].name }}</div>
                <div class="podium-score">{{ finalScores[1].score }}</div>
              </div>
              <div class="podium-base">
                <div class="podium-number">2</div>
              </div>
            </div>

            <!-- 1:a plats -->
            <div v-if="finalScores[0]" class="podium-step first">
              <div class="podium-player">
                <div class="podium-crown">👑</div>
                <div class="podium-avatar winner">
                  {{ getPlayerEmoji(finalScores[0].name) }}
                </div>
                <div class="podium-name">{{ finalScores[0].name }}</div>
                <div class="podium-score">{{ finalScores[0].score }}</div>
              </div>
              <div class="podium-base">
                <div class="podium-number">1</div>
              </div>
            </div>

            <!-- 3:e plats -->
            <div v-if="finalScores[2]" class="podium-step third">
              <div class="podium-player">
                <div class="podium-avatar">
                  {{ getPlayerEmoji(finalScores[2].name) }}
                </div>
                <div class="podium-name">{{ finalScores[2].name }}</div>
                <div class="podium-score">{{ finalScores[2].score }}</div>
              </div>
              <div class="podium-base">
                <div class="podium-number">3</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Fullständig rankning -->
        <div class="full-rankings">
          <h3>Alla resultat</h3>
          <div class="rankings-list">
            <div 
              v-for="(player, index) in finalScores" 
              :key="player.name"
              class="ranking-item"
              :class="{ 
                'is-winner': index === 0,
                'is-podium': index < 3
              }"
            >
              <div class="ranking-position">
                <span v-if="index === 0">🥇</span>
                <span v-else-if="index === 1">🥈</span>
                <span v-else-if="index === 2">🥉</span>
                <span v-else>{{ index + 1 }}</span>
              </div>
              
              <div class="ranking-player">
                <div class="player-avatar">
                  {{ getPlayerEmoji(player.name) }}
                </div>
                <div class="player-info">
                  <div class="player-name">{{ player.name }}</div>
                  <div class="player-performance">
                    {{ getPerformanceText(index, finalScores.length) }}
                  </div>
                </div>
              </div>

              <div class="ranking-score">
                <div class="score-points">{{ player.score }}</div>
                <div class="score-label">poäng</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Statistik och knappar -->
      <div class="game-stats">
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-number">{{ finalScores.length }}</div>
            <div class="stat-label">Spelare</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ getHighestScore() }}</div>
            <div class="stat-label">Högsta poäng</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ getAverageScore() }}</div>
            <div class="stat-label">Snitt-poäng</div>
          </div>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="game-actions">
        <button class="button" @click="$emit('play-again')">
          🎯 Spela igen
        </button>
        <button class="button secondary" @click="goToHome">
          🏠 Tillbaka till start
        </button>
      </div>

      <!-- Konfetti-effekt -->
      <div class="confetti-container" v-if="showConfetti">
        <div v-for="i in 50" :key="i" class="confetti" :style="getConfettiStyle()"></div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'

export default {
  name: 'FinalScoreboard',
  props: {
    finalScores: {
      type: Array,
      default: () => []
    },
    winner: {
      type: Object,
      default: null
    }
  },
  emits: ['play-again'],
  setup(props) {
    const showConfetti = ref(false)

    /**
     * Visa konfetti-animation vid mount
     */
    onMounted(() => {
      showConfetti.value = true
      setTimeout(() => {
        showConfetti.value = false
      }, 5000)
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
     * Hämta prestationstext baserat på placering
     */
    function getPerformanceText(position, totalPlayers) {
      if (position === 0) return 'Fantastiskt! 🎉'
      if (position === 1) return 'Riktigt bra! 👏'
      if (position === 2) return 'Bra jobbat! 👍'
      if (position < totalPlayers / 2) return 'Över medel 📈'
      return 'Bra försök! 💪'
    }

    /**
     * Hämta högsta poäng
     */
    function getHighestScore() {
      return props.finalScores.length > 0 ? props.finalScores[0].score : 0
    }

    /**
     * Beräkna genomsnittlig poäng
     */
    function getAverageScore() {
      if (props.finalScores.length === 0) return 0
      const total = props.finalScores.reduce((sum, player) => sum + player.score, 0)
      return Math.round(total / props.finalScores.length)
    }

    /**
     * Generera random style för konfetti
     */
    function getConfettiStyle() {
      const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7']
      return {
        left: Math.random() * 100 + '%',
        backgroundColor: colors[Math.floor(Math.random() * colors.length)],
        animationDelay: Math.random() * 3 + 's',
        animationDuration: (Math.random() * 3 + 2) + 's'
      }
    }

    /**
     * Gå tillbaka till startsidan
     */
    function goToHome() {
      // Reload sidan för att återställa allt
      window.location.reload()
    }

    return {
      showConfetti,
      getPlayerEmoji,
      getPerformanceText,
      getHighestScore,
      getAverageScore,
      getConfettiStyle,
      goToHome
    }
  }
}
</script>

<style scoped>
.final-scoreboard {
  max-width: 1000px;
  margin: 0 auto;
  position: relative;
}

.game-over-header {
  text-align: center;
  margin-bottom: 3rem;
}

.game-over-header h1 {
  font-size: 2.5rem;
  color: #667eea;
  margin-bottom: 1rem;
}

.winner-announcement {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #333;
  padding: 1.5rem;
  border-radius: 1rem;
  display: inline-flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 8px 25px rgba(255, 215, 0, 0.3);
}

.winner-crown {
  font-size: 2rem;
}

.winner-text {
  font-size: 1.2rem;
  font-weight: 600;
}

.final-standings {
  margin-bottom: 3rem;
}

.final-standings h2 {
  text-align: center;
  color: #374151;
  margin-bottom: 2rem;
  font-size: 1.8rem;
}

.podium-container {
  margin-bottom: 3rem;
}

.podium {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 2rem;
  margin-bottom: 2rem;
}

.podium-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.podium-step.first {
  order: 2;
}

.podium-step.second {
  order: 1;
}

.podium-step.third {
  order: 3;
}

.podium-player {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 1rem;
  padding: 1.5rem;
  text-align: center;
  margin-bottom: 1rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  position: relative;
  min-width: 120px;
}

.podium-crown {
  font-size: 2rem;
  position: absolute;
  top: -1rem;
  left: 50%;
  transform: translateX(-50%);
}

.podium-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(102, 126, 234, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  margin: 0 auto 0.5rem;
}

.podium-avatar.winner {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
}

.podium-name {
  font-weight: bold;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.podium-score {
  color: #667eea;
  font-weight: bold;
  font-size: 1.1rem;
}

.podium-base {
  background: #667eea;
  color: white;
  border-radius: 0.5rem 0.5rem 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.2rem;
  width: 80px;
}

.podium-step.first .podium-base {
  height: 100px;
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #333;
}

.podium-step.second .podium-base {
  height: 80px;
  background: linear-gradient(135deg, #c0c0c0, #e8e8e8);
  color: #333;
}

.podium-step.third .podium-base {
  height: 60px;
  background: linear-gradient(135deg, #cd7f32, #daa520);
  color: white;
}

.full-rankings h3 {
  color: #374151;
  margin-bottom: 1rem;
  text-align: center;
}

.rankings-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.ranking-item {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 1rem;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: all 0.3s ease;
}

.ranking-item.is-winner {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 237, 78, 0.1));
  border-color: rgba(255, 215, 0, 0.3);
}

.ranking-item.is-podium {
  transform: scale(1.02);
}

.ranking-position {
  font-size: 1.5rem;
  font-weight: bold;
  width: 50px;
  text-align: center;
}

.ranking-player {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.player-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(102, 126, 234, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.player-name {
  font-weight: bold;
  color: #374151;
  font-size: 1.1rem;
}

.player-performance {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.ranking-score {
  text-align: right;
}

.score-points {
  font-size: 1.5rem;
  font-weight: bold;
  color: #667eea;
}

.score-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.game-stats {
  margin-bottom: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.stat-item {
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

.game-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.game-actions .button {
  font-size: 1.1rem;
  padding: 1rem 2rem;
}

.confetti-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1000;
}

.confetti {
  position: absolute;
  width: 10px;
  height: 10px;
  animation: confetti-fall linear infinite;
}

@keyframes confetti-fall {
  0% {
    transform: translateY(-100vh) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(360deg);
    opacity: 0;
  }
}

@media (max-width: 768px) {
  .game-over-header h1 {
    font-size: 2rem;
  }

  .winner-announcement {
    flex-direction: column;
    text-align: center;
  }

  .podium {
    flex-direction: column;
    gap: 1rem;
  }

  .podium-step {
    order: unset !important;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .game-actions {
    flex-direction: column;
  }

  .ranking-item {
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .ranking-position {
    width: 40px;
    font-size: 1.2rem;
  }
}
</style>