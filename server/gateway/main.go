package main

import (
	users "INFO441-Blackjack/server/database"
	handlers "INFO441-Blackjack/server/gateway/handlers"
	"INFO441-Blackjack/server/gateway/sessions"
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"

	"github.com/go-redis/redis"
	_ "github.com/go-sql-driver/mysql"
	"github.com/gorilla/mux"
	"github.com/streadway/amqp"
)

func failOnError(err error, msg string) {
	if err != nil {
		log.Fatalf("%s: %s", msg, err)
	}
}

func getSplitURLs(addrs string) []*url.URL {
	splitAddrs := strings.Split(addrs, ",")
	URLs := make([]*url.URL, len(splitAddrs))
	for i, c := range splitAddrs {
		URL, err := url.Parse(c)
		if err != nil {
			log.Fatal(fmt.Printf("Failed to parse url %v", err))
		}
		URLs[i] = URL
	}
	return URLs
}

func main() {
	// read ENV variables
	addr := os.Getenv("ADDR")
	if len(addr) == 0 {
		addr = ":443"
	}
	// read ENV variables
	tlsKeyPath := os.Getenv("TLSKEY")
	tlsCertPath := os.Getenv("TLSCERT")
	sessionKey := os.Getenv("SESSIONKEY")
	redisAddr := os.Getenv("REDISADDR")
	chatAddrs := os.Getenv("CHATADDR")
	gameAddrs := os.Getenv("GAMEADDR")
	rabbitAddr := os.Getenv("RABBITADDR")
	rabbitQueueName := os.Getenv("RABBITQUEUENAME")

	dsn := os.Getenv("DSN")

	// create new redis client
	rdb := redis.NewClient(&redis.Options{
		Addr: redisAddr,
	})
	sessionStore := sessions.NewRedisStore(rdb, 120000000000)

	//open  mysql db
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		panic(err.Error())
	}

	userStore := users.NewMysqlRepository(db)
	msgqURL := fmt.Sprintf("amqp://%s", rabbitAddr)
	// Connect to RabbitMQ server
	conn, err := amqp.Dial(msgqURL)
	failOnError(err, "Failed to connect to RabbitMQ")
	defer conn.Close()

	ch, err := conn.Channel()
	failOnError(err, "Failed to create channel")
	defer ch.Close()

	q, err := ch.QueueDeclare(rabbitQueueName, true, false, false, false, nil)

	queueMsgs, err := ch.Consume(q.Name, "", false, false, false, false, nil)

	failOnError(err, "Failed to register a consumer")

	notifier := handlers.NewNotifier(queueMsgs)

	// defer the close till after the main function has finished
	// executing
	defer db.Close()

	chatURLs := getSplitURLs(chatAddrs)
	gameURLs := getSplitURLs(gameAddrs)

	// TODO: Create and initialize a new instance of your handler context
	context := &handlers.HandlerContext{SigningKey: sessionKey, Store: sessionStore, Users: userStore, Notifier: notifier}

	mux := mux.NewRouter()
	/*
		TODO: setup endpoints
			/v1/Users/register
			/v1/Users/{userid}/unregister
			/v1/Games/{gameid}/Users/{userid}/bet
			/v1/Games/{gameid}/Users/{userid}/hit
			/v1/Games/{gameid}/Users/{userid}/stand
	*/
	mux.HandleFunc("/v1/users/signup", context.SignUpHandler)     // To sign up
	mux.HandleFunc("/v1/users/register", context.SessionsHandler) // For login
	mux.HandleFunc("/v1/users/register/{UserID}", context.SpecificSessionHandler)
	mux.Handle("/v1/users/unregister/{UserID}", context.NewServiceProxy(gameURLs)) // To end session

	mux.Handle("/v1/games/{GameID}/users/{UserID}/bet", context.NewServiceProxy(gameURLs)) // To bet
	// mux.Handle("v1/games/{gameID}/users/{userID}/deal")
	mux.Handle("/v1/games/{GameID}/users/{UserID}/hit", context.NewServiceProxy(gameURLs))   // To hit
	mux.Handle("/v1/games/{GameID}/users/{UserID}/stand", context.NewServiceProxy(gameURLs)) // To stand

	mux.Handle("/v1/games/{GameID}", context.NewServiceProxy(chatURLs)) // Add message to chat
	mux.Handle("/v1/websocket", context.NewWebSocketHandler(notifier))

	wrappedMux := handlers.NewSetHeader(mux)

	log.Printf("server is listening at %s...", addr)
	log.Fatal(http.ListenAndServeTLS(addr, tlsCertPath, tlsKeyPath, wrappedMux))
}
