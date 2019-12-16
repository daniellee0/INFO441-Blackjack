package handlers

import (
	"INFO441-Blackjack/server/gateway/models/users"
	"INFO441-Blackjack/server/gateway/sessions"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"path/filepath"
	"strconv"
	"sync"
	"sync/atomic"
	"time"

	"github.com/streadway/amqp"
)

// Message struct to send to client
type Message struct {
	Type string      `json:"type"`
	User *users.User `json:"user"`
}

//TODO: define HTTP handler functions as described in the
//assignment description. Remember to use your handler context
//struct as the receiver on these functions so that you have
//access to things like the session store and user store.

//SignUpHandler something something
func (ctx *HandlerContext) SignUpHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "that method is not allowed", http.StatusMethodNotAllowed)
		return
	}
	contentType := r.Header.Get("Content-Type")
	if contentType != "application/json" {
		http.Error(w, "request body must be in JSON", http.StatusUnsupportedMediaType)
		return
	}
	newUser := &users.NewUser{}
	dec := json.NewDecoder(r.Body)
	err := dec.Decode(newUser)
	if err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	if err := newUser.Validate(); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	user, err := newUser.ToUser()
	if err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	addedUser, err := ctx.Users.Insert(user)
	if err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	state := sessions.SessionState{SessionTime: time.Now(), User: addedUser}

	_, err2 := sessions.BeginSession(ctx.SigningKey, ctx.Store, state, w)
	if err2 != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusCreated)
	w.Header().Add("Content-Type", "application/json")

	err = json.NewEncoder(w).Encode(addedUser)

	if err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
	}

}

//SpecificUserHandler something something
func (ctx *HandlerContext) SpecificUserHandler(w http.ResponseWriter, r *http.Request) {
	_, err := sessions.GetSessionID(r, ctx.SigningKey)
	if err != nil {
		http.Error(w, "Session id: current user not authenticated", http.StatusUnauthorized)
		return
	}
	state := &sessions.SessionState{}
	if _, stateErr := sessions.GetState(r, ctx.SigningKey, ctx.Store, state); stateErr != nil {
		http.Error(w, fmt.Sprintf("error retrieving session state: %v", stateErr), http.StatusUnauthorized)
		return
	}

	base := filepath.Base(r.URL.Path)

	if r.Method == "GET" {
		var user *users.User
		var err error
		if base == "me" {
			user, err = ctx.Users.GetByID(state.User.ID)
		} else {
			rID, err2 := strconv.ParseInt(base, 10, 64)
			if err2 != nil {
				http.Error(w, "requested user not found", http.StatusNotFound)
				return
			}
			user, err = ctx.Users.GetByID(rID)
		}

		if err != nil {
			http.Error(w, "requested user not found", http.StatusNotFound)
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Header().Set("Content-Type", "application/json")

		err = json.NewEncoder(w).Encode(user)

		if err != nil {
			http.Error(w, "Bad request", http.StatusBadRequest)
		}
	} else {
		http.Error(w, "that method is not allowed", http.StatusMethodNotAllowed)
	}
}

//SessionsHandler something something
func (ctx *HandlerContext) SessionsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "that method is not allowed", http.StatusMethodNotAllowed)
		return
	}
	contentType := r.Header.Get("Content-Type")
	if contentType != "application/json" {
		http.Error(w, "request body must be in JSON", http.StatusUnsupportedMediaType)
		return
	}
	credentials := &users.Credentials{}
	dec := json.NewDecoder(r.Body)
	err := dec.Decode(credentials)
	if err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	user, err := ctx.Users.GetByEmail(credentials.Email)
	if err != nil {
		http.Error(w, "invalid credentials", http.StatusUnauthorized)
		return
	}

	err = user.Authenticate(credentials.Password)
	if err != nil {
		http.Error(w, "invalid credentials", http.StatusUnauthorized)
		return
	}

	state := sessions.SessionState{SessionTime: time.Now(), User: user}

	_, err2 := sessions.BeginSession(ctx.SigningKey, ctx.Store, state, w)
	if err2 != nil {
		fmt.Println("failed to begin session")
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	addError := ctx.Users.AddUserToGame(user.ID)
	if addError != nil {
		fmt.Println("failed to add user to game")
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}
	sendNewUserToClients(user)

	w.WriteHeader(http.StatusCreated)
	w.Header().Set("Content-Type", "application/json")

	gameState, err3 := ctx.Users.GetGameState(1, user.ID)
	if err3 != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	err = json.NewEncoder(w).Encode(gameState)

	if err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
	}
	// Send message to

}

//SpecificSessionHandler something something
func (ctx *HandlerContext) SpecificSessionHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "DELETE" {
		http.Error(w, "that method is not allowed", http.StatusMethodNotAllowed)
		return
	}
	path := r.URL.Path
	base := filepath.Base(path)
	if base != "mine" {
		http.Error(w, "invalid resource path identifier", http.StatusForbidden)
		return
	}

	sessions.EndSession(r, ctx.SigningKey, ctx.Store)

	w.Write([]byte("signed out"))
}

//NewServiceProxy blah blah
func (ctx *HandlerContext) NewServiceProxy(addrs []*url.URL) *httputil.ReverseProxy {
	var indexNext int32
	indexNext = 0
	mutex := sync.Mutex{}
	return &httputil.ReverseProxy{
		Director: func(r *http.Request) {
			state := &sessions.SessionState{}
			sessions.GetState(r, ctx.SigningKey, ctx.Store, state)
			if state.User != nil {
				userJSON, err := json.Marshal(state.User)
				log.Printf("UserJSON: %s", string(userJSON))
				if err != nil {
					log.Printf("Error marshaling user: %v", err)
					return
				}
				r.Header.Add("X-User", string(userJSON))
			} else {
				r.Header.Del("X-User")
			}
			mutex.Lock()
			defer mutex.Unlock()
			target := addrs[indexNext%int32(len(addrs))]
			atomic.AddInt32(&indexNext, 1)
			r.Header.Add("X-Forwarded-Host", r.Host)
			r.Host = target.Host
			r.URL.Host = target.Host
			r.URL.Scheme = target.Scheme
		},
	}
}

func failOnError(err error, msg string) {
	if err != nil {
		log.Fatalf("%s: %s", msg, err)
	}
}

func sendNewUserToClients(user *users.User) {
	conn, rabErr := amqp.Dial("amqp://rabbit:5672")
	failOnError(rabErr, "Failed to connect to RabbitMQ")
	defer conn.Close()

	ch, err := conn.Channel()
	failOnError(err, "Failed to open a channel")
	defer ch.Close()

	m := Message{"user-new", user}
	b, err := json.Marshal(m)

	err = ch.Publish(
		"",      // exchange
		"queue", // routing key
		false,   // mandatory
		false,   // immediate
		amqp.Publishing{
			ContentType: "text/plain",
			Body:        b,
		})
	failOnError(err, "Failed to publish a message")
}
