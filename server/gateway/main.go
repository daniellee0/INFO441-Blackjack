package main

import(
	"net/http"
	"log"
	"os"
	// "database/sql"
	// "github.com/go-redis/redis"
	_ "github.com/go-sql-driver/mysql"
	handlers "INFO441-Blackjack/server/gateway/handlers"
	// sessions "INFO441-Blackjack/server/gateway/sessions"
)


	
func main(){
	// read ENV variables
	addr := os.Getenv("ADDR")
	if len(addr) == 0 {addr = ":443"}
	// tlsKeyPath := os.Getenv("TLSKEY")
	// tlsCertPath := os.Getenv("TLSCERT")
	// redisAddr := os.Getenv("REDISADDR")
	// dsn := os.Getenv("DSN")

	// // create new redis client
	// rdb := redis.NewClient(&redis.Options{
	// 	Addr:     redisAddr,
	// 	Password: "",
	// 	DB:       0,
	// })
	// sessionStore := sessions.NewRedisStore(rdb, 120000000000)

	// //open  mysql db
	// db, err := sql.Open("mysql", dsn)
	// if err != nil {
	// 	panic(err.Error())
	// }

	// // defer the close till after the main function has finished
	// // executing
	// defer db.Close()




	mux := http.NewServeMux()
	/* 
	TODO: setup endpoints
		/v1/Users/register
		/v1/Users/{userid}/unregister
		/v1/Games/{gameid}/Users/{userid}/bet
		v1/Games/{gameid}/Users/{userid}/deal
		/v1/Games/{gameid}/Users/{userid}/hit
		/v1/Games/{gameid}/Users/{userid}/stand
	*/
	mux.HandleFunc("/v1/Users/register", handlers.RegisterPlayer)
	log.Printf("server is listening at %s...", addr)
	log.Fatal(http.ListenAndServe(addr, mux))
	// log.Fatal(http.ListenAndServeTLS(addr, tlsCertPath, tlsKeyPath, mux))
}