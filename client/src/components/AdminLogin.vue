<template>
  <div class="admin-login">
    <div class="card">
      <div class="login-header">
        <h2>🔐 Admin-inloggning</h2>
        <p>Logga in för att hantera quiz-spelet</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="username" class="label">Användarnamn</label>
          <input
            id="username"
            v-model="credentials.username"
            type="text"
            class="input"
            placeholder="admin"
            :disabled="isLoading"
            required
          />
        </div>

        <div class="form-group">
          <label for="password" class="label">Lösenord</label>
          <input
            id="password"
            v-model="credentials.password"
            type="password"
            class="input"
            placeholder="Ditt lösenord"
            :disabled="isLoading"
            required
          />
        </div>

        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <button 
          type="submit" 
          class="button"
          :disabled="isLoading || !canLogin"
        >
          <span v-if="isLoading">Loggar in...</span>
          <span v-else>🚀 Logga in</span>
        </button>
      </form>

      <div class="login-info">
        <h3>Standard admin-konto:</h3>
        <div class="default-credentials">
          <div class="credential-item">
            <strong>Användarnamn:</strong> admin
          </div>
          <div class="credential-item">
            <strong>Lösenord:</strong> quiz123
          </div>
        </div>
        <p class="security-note">
          ⚠️ Ändra lösenordet i produktion!
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, inject } from 'vue'
import apiService from '../services/api'

export default {
  name: 'AdminLogin',
  emits: ['login-success'],
  setup(props, { emit }) {
    const showToast = inject('showToast')

    // Reaktiv state
    const credentials = ref({
      username: '',
      password: ''
    })
    const isLoading = ref(false)
    const errorMessage = ref('')

    // Computed
    const canLogin = computed(() => {
      return credentials.value.username.trim() && credentials.value.password.trim()
    })

    /**
     * Hantera inloggning
     */
    async function handleLogin() {
      if (!canLogin.value) return

      isLoading.value = true
      errorMessage.value = ''

      try {
        const response = await apiService.login(
          credentials.value.username.trim(),
          credentials.value.password
        )

        if (response.success) {
          // Skicka lyckad inloggning till parent
          emit('login-success', response.data)
          
          // Rensa formulär
          credentials.value = { username: '', password: '' }
        } else {
          errorMessage.value = response.message || 'Inloggning misslyckades'
        }
      } catch (error) {
        console.error('Login error:', error)
        
        if (error.response?.status === 401) {
          errorMessage.value = 'Ogiltigt användarnamn eller lösenord'
        } else {
          errorMessage.value = 'Anslutningsfel. Försök igen.'
        }
        
        showToast(errorMessage.value, 'error')
      } finally {
        isLoading.value = false
      }
    }

    return {
      credentials,
      isLoading,
      errorMessage,
      canLogin,
      handleLogin
    }
  }
}
</script>

<style scoped>
.admin-login {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 70vh;
}

.card {
  max-width: 450px;
  width: 100%;
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-header h2 {
  color: #667eea;
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
}

.login-header p {
  color: #6b7280;
  font-size: 1rem;
}

.login-form {
  margin-bottom: 2rem;
}

.error-message {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 0.5rem;
  padding: 0.75rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;
  text-align: center;
}

.button {
  width: 100%;
  font-size: 1.1rem;
  padding: 1rem;
}

.login-info {
  background: rgba(59, 130, 246, 0.05);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 0.75rem;
  padding: 1.5rem;
}

.login-info h3 {
  color: #3b82f6;
  margin-bottom: 1rem;
  font-size: 1rem;
}

.default-credentials {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
}

.credential-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
}

.credential-item:not(:last-child) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.security-note {
  color: #f59e0b;
  font-size: 0.875rem;
  font-weight: 500;
  text-align: center;
  margin: 0;
}

@media (max-width: 768px) {
  .admin-login {
    min-height: 60vh;
  }

  .login-header h2 {
    font-size: 1.5rem;
  }

  .login-info {
    padding: 1rem;
  }

  .credential-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
}
</style>