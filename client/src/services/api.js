import axios from 'axios'

/**
 * API service för kommunikation med backend
 */
class ApiService {
  constructor() {
    this.baseURL = 'http://localhost:3001/api'
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      withCredentials: true, // För sessions
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Interceptor för att hantera fel
    this.axiosInstance.interceptors.response.use(
      response => response,
      error => {
        console.error('API-fel:', error.response?.data || error.message)
        return Promise.reject(error)
      }
    )
  }

  /**
   * Autentisering
   */
  async login(username, password) {
    const response = await this.axiosInstance.post('/auth/login', {
      username,
      password
    })
    return response.data
  }

  async logout() {
    const response = await this.axiosInstance.post('/auth/logout')
    return response.data
  }

  async getAuthStatus() {
    const response = await this.axiosInstance.get('/auth/status')
    return response.data
  }

  /**
   * Frågor (Questions)
   */
  async getAllQuestions() {
    const response = await this.axiosInstance.get('/questions')
    return response.data
  }

  async getQuestionById(id) {
    const response = await this.axiosInstance.get(`/questions/${id}`)
    return response.data
  }

  async getRandomQuestions(count = 10) {
    const response = await this.axiosInstance.get(`/questions/random/${count}`)
    return response.data
  }

  async createQuestion(questionData) {
    const response = await this.axiosInstance.post('/questions', questionData)
    return response.data
  }

  async updateQuestion(id, questionData) {
    const response = await this.axiosInstance.put(`/questions/${id}`, questionData)
    return response.data
  }

  async deleteQuestion(id) {
    const response = await this.axiosInstance.delete(`/questions/${id}`)
    return response.data
  }
}

// Skapa singleton-instans
const apiService = new ApiService()

export default apiService