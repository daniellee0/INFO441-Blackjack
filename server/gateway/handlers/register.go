package handlers

import(
	"net/http"
	"encoding/json"

	users "INFO441-Blackjack/server/gateway/models/users"

)

// RegisterPlayer will register a new user
func RegisterPlayer(w http.ResponseWriter, r *http.Request){
	
	//  Double check the URL path
	// TODO: provide correct URL
	if r.URL.Path != "/v1/Users/register" {
        http.Error(w, "404 not found.", http.StatusNotFound)
        return
	}
	// Double check it's a post request being made
	 if r.Method != http.MethodPost {
       	http.Error(w, "invalid_http_method", http.StatusMethodNotAllowed)
    	return
	}

	p := users.NewUser{}

	dec := json.NewDecoder(r.Body)
	err := dec.Decode(p)
	if err != nil {
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

	/* 
	TODO: 
		add player to database
	*/

	
}