package handlers

import(
	"net/http"
	"encoding/json"
	"fmt"
	"reflect"

	users "INFO441-Blackjack/server/gateway/models/users"

)

// RegisterPlayer will register a new user
func RegisterPlayer(w http.ResponseWriter, r *http.Request){
	
	//  Double check the URL path
	// TODO: provide correct URL
	// if r.URL.Path != "/v1/Users/register" {
    //     http.Error(w, "404 not found.", http.StatusNotFound)
    //     return
	// }
	// Double check it's a post request being made
	 if r.Method != http.MethodPost {
       	http.Error(w, "invalid_http_method", http.StatusMethodNotAllowed)
    	return
	}
	contentType := r.Header.Get("Content-Type")
	if contentType == "application/json" {
		http.Error(w, "request body must be in JSON", http.StatusUnsupportedMediaType)
		return
	}
	p := users.NewUser{}
	dec := json.NewDecoder(r.Body)
	err := dec.Decode(&p)
	// fmt.Print(p)
	if err != nil {
		fmt.Println(err)
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	if err := p.Validate(); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	player, err := p.ToUser()
	if err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	fmt.Println(reflect.TypeOf(player.Chips), reflect.TypeOf(player.Cards))


	/* 
	TODO: 
		add player to database
	*/

	
}