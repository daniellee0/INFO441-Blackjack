package main

import(
	"net/http"
	"log"
	"os"
	"github.com/go-redis/redis"
	sessions "INFO441-Blackjack/server/gateway/sessions"
)


	
func main(){
	// read ENV variables
	addr := os.Getenv("ADDR")
	if len(addr) == 0 {addr = ":443"}
	tlsKeyPath := os.Getenv("TLSKEY")
	tlsCertPath := os.Getenv("TLSCERT")
	redisAddr := os.Getenv("REDISADDR")

	// create new redis client
	rdb := redis.NewClient(&redis.Options{
		Addr:     redisAddr,
		Password: "",
		DB:       0,
	})
	sessionStore := sessions.NewRedisStore(rdb, 120000000000)






	mux := http.NewServeMux()

	log.Printf("server is listening at %s...", addr)
	log.Fatal(http.ListenAndServeTLS(addr, tlsCertPath, tlsKeyPath, mux))
}