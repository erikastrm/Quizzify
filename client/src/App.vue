<template>
  <div id="app">
    <!-- Huvudnavigation -->
    <nav class="navbar">
      <div class="nav-container">
        <h1 class="nav-title">🎯 Realtids Quiz</h1>
        <div class="nav-links">
          <router-link to="/" class="nav-link">Spela</router-link>
          <router-link to="/admin" class="nav-link">Admin</router-link>
        </div>
      </div>
    </nav>

    <!-- Huvudinnehåll -->
    <main class="main-content">
      <router-view />
    </main>

    <!-- Toast-meddelanden -->
    <div v-if="toastMessage" class="toast" :class="toastType">
      {{ toastMessage }}
    </div>
  </div>
</template>

<script>
import { ref, provide } from 'vue'

export default {
  name: 'App',
  setup() {
    const toastMessage = ref('')
    const toastType = ref('info')

    // Toast-funktion som kan användas av alla komponenter
    const showToast = (message, type = 'info') => {
      toastMessage.value = message
      toastType.value = type
      
      setTimeout(() => {
        toastMessage.value = ''
      }, 4000)
    }

    // Gör toast tillgänglig för alla child-komponenter
    provide('showToast', showToast)

    return {
      toastMessage,
      toastType
    }
  }
}
</script>

<style>
/* Global stilar */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  color: #333;
}

#app {
  min-height: 100vh;
}

/* Navigation */
.navbar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-title {
  color: #667eea;
  font-size: 1.5rem;
  font-weight: bold;
}

.nav-links {
  display: flex;
  gap: 2rem;
}

.nav-link {
  color: #333;
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  transition: all 0.3s ease;
}

.nav-link:hover {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.nav-link.router-link-active {
  background: #667eea;
  color: white;
}

/* Huvudinnehåll */
.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  min-height: calc(100vh - 80px);
}

/* Toast-meddelanden */
.toast {
  position: fixed;
  top: 100px;
  right: 2rem;
  padding: 1rem 1.5rem;
  border-radius: 0.5rem;
  color: white;
  font-weight: 500;
  z-index: 1000;
  animation: slideIn 0.3s ease;
}

.toast.success {
  background: #10b981;
}

.toast.error {
  background: #ef4444;
}

.toast.warning {
  background: #f59e0b;
}

.toast.info {
  background: #3b82f6;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Gemensamma komponentstilar */
.card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.button {
  background: #667eea;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.button:hover {
  background: #5a67d8;
  transform: translateY(-2px);
}

.button:active {
  transform: translateY(0);
}

.button.secondary {
  background: #6b7280;
}

.button.secondary:hover {
  background: #4b5563;
}

.button.success {
  background: #10b981;
}

.button.success:hover {
  background: #059669;
}

.button.danger {
  background: #ef4444;
}

.button.danger:hover {
  background: #dc2626;
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.input:focus {
  outline: none;
  border-color: #667eea;
}

.form-group {
  margin-bottom: 1.5rem;
}

.label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

/* Responsiv design */
@media (max-width: 768px) {
  .nav-container {
    flex-direction: column;
    gap: 1rem;
    padding: 0 1rem;
  }

  .nav-links {
    gap: 1rem;
  }

  .main-content {
    padding: 1rem;
  }

  .card {
    padding: 1.5rem;
  }

  .toast {
    right: 1rem;
    left: 1rem;
  }
}
</style>