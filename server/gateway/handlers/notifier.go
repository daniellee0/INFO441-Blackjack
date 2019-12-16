package handlers

import (
	"INFO441-Blackjack/server/gateway/models/users"
	"encoding/json"
	"log"
	"strconv"
	"sync"

	"github.com/gorilla/websocket"
	"github.com/streadway/amqp"
)

//Notifier .
type Notifier struct {
	clients    map[string]*websocket.Conn
	eventQueue <-chan amqp.Delivery
	mutex      sync.RWMutex
}

//NewNotifier .
func NewNotifier(event <-chan amqp.Delivery) *Notifier {
	notifier := &Notifier{
		clients:    make(map[string]*websocket.Conn),
		eventQueue: event,
	}

	go notifier.SendToClients()
	return notifier
}

//ReceivedMessage .
type ReceivedMessage struct {
	messageType string
	userIDs     []int
	user        *users.User
}

//SendToClients .
func (nf *Notifier) SendToClients() {
	for {
		event := <-nf.eventQueue
		nf.mutex.RLock()
		var message ReceivedMessage
		if err := json.Unmarshal(event.Body, &message); err != nil {
			log.Printf("Error: %v", err)
		}

		if len(message.userIDs) > 0 {
			for i := 0; i < len(message.userIDs); i++ {
				userID := strconv.Itoa(message.userIDs[i])
				if _, ok := nf.clients[userID]; ok {
					// Do not send new user message to the same user
					// if strconv.FormatInt(message.user.ID, 10) != userID {
					err := nf.clients[userID].WriteMessage(websocket.TextMessage, event.Body)
					if err != nil {
						log.Printf("Error: %v", err)
					}
					// }
				}
			}
		} else {
			for _, client := range nf.clients {
				err := client.WriteMessage(websocket.TextMessage, event.Body)
				if err != nil {
					log.Printf("Error: %v", err)
				}
			}
		}
		event.Ack(false)
		nf.mutex.RUnlock()
	}
}

//AddClient .
func (nf *Notifier) AddClient(client *websocket.Conn, clientID int64) {
	nf.mutex.Lock()
	id := strconv.FormatInt(clientID, 10)
	nf.clients[id] = client
	nf.mutex.Unlock()
	for {
		// Removes client if they disconnect or error
		if _, _, err := client.NextReader(); err != nil {
			client.Close()
			nf.mutex.Lock()
			delete(nf.clients, id)
			nf.mutex.Unlock()
			break
		}
	}

}
