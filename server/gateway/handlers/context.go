package handlers

import (
	"INFO441-Blackjack/server/gateway/models/users"
	"INFO441-Blackjack/server/gateway/sessions"
)

//TODO: define a handler context struct that
//will be a receiver on any of your HTTP
//handler functions that need access to
//globals, such as the key used for signing
//and verifying SessionIDs, the session store
//and the user store

//HandlerContext stores global information for
//authentication handlers.
type HandlerContext struct {
	SigningKey string
	Store      sessions.Store
	Users      users.Store
	Notifier   *Notifier
}
