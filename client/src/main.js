import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Skapa Vue-app
const app = createApp(App)

// Använd router
app.use(router)

// Montera appen
app.mount('#app')