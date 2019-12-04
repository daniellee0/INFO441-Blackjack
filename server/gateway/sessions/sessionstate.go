package handlers

import (
	"assignments-daniellee0/servers/gateway/models/users"
	"time"
)

//TODO: define a session state struct for this web server
//see the assignment description for the fields you should include
//remember that other packages can only see exported fields!

// SessionState stores session time and authenticated user
type SessionState struct {
	SessionTime time.Time   `json:"session_time"`
	User        *users.User `json:"user"`
}
