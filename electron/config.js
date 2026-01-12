/**
 * Configuration pour la connexion mentor/enfant
 * 
 * À configurer selon ton réseau local
 */

module.exports = {
  // IP du Mac du mentor (là où tourne le serveur WebSocket)
  // Pour trouver ton IP : Préférences Système → Réseau → Wi-Fi → Adresse IP
  MENTOR_IP: process.env.MENTOR_IP || '192.168.1.1',
  
  // Port du serveur WebSocket
  WEBSOCKET_PORT: parseInt(process.env.WEBSOCKET_PORT || '3002'),
  
  // URL complète du serveur mentor
  get MENTOR_SERVER_URL() {
    return `ws://${this.MENTOR_IP}:${this.WEBSOCKET_PORT}`
  },
}

