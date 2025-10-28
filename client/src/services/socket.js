import io from 'socket.io-client'

/**
 * Socket.IO service för realtidskommunikation
 * Hanterar anslutning och events mellan klient och server
 */
class SocketService {
  constructor() {
    this.socket = null
    this.listeners = new Map()
  }

  /**
   * Anslut till Socket.IO-servern
   */
  connect(serverUrl = 'http://localhost:3001') {
    if (this.socket?.connected) {
      return this.socket
    }

    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true
    })

    // Hantera anslutning
    this.socket.on('connect', () => {
      console.log('✅ Ansluten till quiz-server:', this.socket.id)
    })

    // Hantera frånkoppling
    this.socket.on('disconnect', (reason) => {
      console.log('❌ Frånkopplad från server:', reason)
    })

    // Hantera anslutningsfel
    this.socket.on('connect_error', (error) => {
      console.error('🔥 Anslutningsfel:', error)
    })

    return this.socket
  }

  /**
   * Koppla från servern
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.listeners.clear()
    }
  }

  /**
   * Lyssna på event från servern
   */
  on(event, callback) {
    if (!this.socket) {
      console.warn('Socket inte ansluten')
      return
    }

    this.socket.on(event, callback)
    
    // Spara callback för att kunna ta bort senare
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
  }

  /**
   * Sluta lyssna på event
   */
  off(event, callback) {
    if (!this.socket) return

    this.socket.off(event, callback)
    
    // Ta bort från listeners
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  /**
   * Skicka event till servern
   */
  emit(event, data) {
    if (!this.socket) {
      console.warn('Socket inte ansluten')
      return
    }

    this.socket.emit(event, data)
  }

  /**
   * Kontrollera om ansluten
   */
  isConnected() {
    return this.socket?.connected || false
  }

  /**
   * Hämta socket ID
   */
  getSocketId() {
    return this.socket?.id
  }
}

// Skapa singleton-instans
const socketService = new SocketService()

export default socketService