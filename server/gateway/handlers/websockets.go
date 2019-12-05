package handlers

import (
	"INFO441-Blackjack/server/gateway/sessions"
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

//TODO: add a handler that upgrades clients to a WebSocket connection
//and adds that to a list of WebSockets to notify when events are
//read from the RabbitMQ server. Remember to synchronize changes
//to this list, as handlers are called concurrently from multiple
//goroutines.

//TODO: start a goroutine that connects to the RabbitMQ server,
//reads events off the queue, and broadcasts them to all of
//the existing WebSocket connections that should hear about
//that event. If you get an error writing to the WebSocket,
//just close it and remove it from the list
//(client went away without closing from
//their end). Also make sure you start a read pump that
//reads incoming control messages, as described in the
//Gorilla WebSocket API documentation:
//http://godoc.org/github.com/gorilla/websocket

//WebSocketHandler .
type WebSocketHandler struct {
	notifier *Notifier
	upgrader *websocket.Upgrader
	ctx      *HandlerContext
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

//NewWebSocketHandler .
func (ctx *HandlerContext) NewWebSocketHandler(notifier *Notifier) *WebSocketHandler {
	return &WebSocketHandler{
		notifier: notifier,
		upgrader: &websocket.Upgrader{
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
			CheckOrigin:     func(r *http.Request) bool { return true },
		},
		ctx: ctx,
	}
}

func (websh *WebSocketHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	sessionState := sessions.SessionState{}
	_, err := sessions.GetState(r, websh.ctx.SigningKey, websh.ctx.Store, sessionState)
	if err != nil {
		auth := r.URL.Query().Get("auth")
		if auth == "" {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		r.Header.Del("X-User")
	}
	log.Println("WebSocket upgrade req received")
	conn, err := websh.upgrader.Upgrade(w, r, nil)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error connecting to WebSocket: %v", err), http.StatusInternalServerError)
		return
	}
	go websh.notifier.AddClient(conn, sessionState.User.ID)

}
