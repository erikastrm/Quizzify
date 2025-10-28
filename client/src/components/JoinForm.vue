<template>
  <div class="join-form">
    <div class="card">
      <div class="form-header">
        <h2>🎯 Gå med i Quiz</h2>
        <p>Ange ditt användarnamn för att börja spela</p>
      </div>

      <form @submit.prevent="submitJoin" class="join-form-content">
        <div class="form-group">
          <label for="playerName" class="label">Användarnamn</label>
          <input
            id="playerName"
            v-model="playerName"
            type="text"
            class="input"
            placeholder="Ditt namn..."
            :disabled="isJoining"
            maxlength="20"
            required
          />
          <div class="input-hint">
            Välj ett unikt namn (max 20 tecken)
          </div>
        </div>

        <button 
          type="submit" 
          class="button"
          :disabled="!playerName.trim() || isJoining"
        >
          <span v-if="isJoining">Ansluter...</span>
          <span v-else>🚀 Gå med</span>
        </button>
      </form>

      <div class="game-info">
        <h3>Hur det fungerar:</h3>
        <ul>
          <li>✅ Ange ditt användarnamn</li>
          <li>⏳ Vänta på att spelledaren startar</li>
          <li>🎯 Svara på frågor så snabbt som möjligt</li>
          <li>🏆 Se din placering i realtid</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'JoinForm',
  emits: ['player-joined'],
  setup(props, { emit }) {
    const playerName = ref('')
    const isJoining = ref(false)

    /**
     * Hantera formulär-submit
     */
    function submitJoin() {
      const name = playerName.value.trim()
      
      if (!name) {
        return
      }

      if (name.length > 20) {
        return
      }

      isJoining.value = true

      // Skicka namn till parent-komponenten
      emit('player-joined', name)

      // Återställ efter en kort tid (om det misslyckas)
      setTimeout(() => {
        isJoining.value = false
      }, 5000)
    }

    return {
      playerName,
      isJoining,
      submitJoin
    }
  }
}
</script>

<style scoped>
.join-form {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.card {
  max-width: 500px;
  width: 100%;
}

.form-header {
  text-align: center;
  margin-bottom: 2rem;
}

.form-header h2 {
  color: #667eea;
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.form-header p {
  color: #6b7280;
  font-size: 1.1rem;
}

.join-form-content {
  margin-bottom: 2rem;
}

.input-hint {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.5rem;
}

.button {
  width: 100%;
  font-size: 1.1rem;
  padding: 1rem;
}

.game-info {
  background: rgba(102, 126, 234, 0.05);
  border: 1px solid rgba(102, 126, 234, 0.2);
  border-radius: 0.75rem;
  padding: 1.5rem;
}

.game-info h3 {
  color: #667eea;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.game-info ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.game-info li {
  padding: 0.5rem 0;
  color: #4b5563;
  font-size: 0.95rem;
}

.game-info li:not(:last-child) {
  border-bottom: 1px solid rgba(102, 126, 234, 0.1);
}

@media (max-width: 768px) {
  .join-form {
    min-height: 50vh;
  }

  .form-header h2 {
    font-size: 1.75rem;
  }

  .form-header p {
    font-size: 1rem;
  }

  .game-info {
    padding: 1rem;
  }
}
</style>