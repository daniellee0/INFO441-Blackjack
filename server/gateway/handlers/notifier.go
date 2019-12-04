package handlers

import (
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

//UserIds .
type UserIds struct {
	userIDs []int
}

//SendToClients .
func (nf *Notifier) SendToClients() {
	for {
		event := <-nf.eventQueue
		nf.mutex.RLock()
		var bodyIDs UserIds
		if err := json.Unmarshal(event.Body, &bodyIDs); err != nil {
			log.Printf("Error: %v", err)
		}

		if len(bodyIDs.userIDs) > 0 {
			for i := 0; i < len(bodyIDs.userIDs); i++ {
				userID := strconv.Itoa(bodyIDs.userIDs[i])
				if _, ok := nf.clients[userID]; ok {
					err := nf.clients[userID].WriteMessage(websocket.TextMessage, event.Body)
					if err != nil {
						log.Printf("Error: %v", err)
					}
				}
			}
		} else {
			// log.Println(nf.clients)
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
