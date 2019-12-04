package sessions

import (
	"errors"
)

//ErrStateNotFound is returned from Store.Get() when the requested
//session id was not found in the store
var ErrStateNotFound = errors.New("no session state was found in the session store")

//Store represents a session data store.
type Store interface {
	//Save saves the provided `sessionState` and associated SessionID to the store.
	//The `sessionState` parameter is typically a pointer to a struct containing
	//all the data you want to associated with the given SessionID.
	Save(sid SessionID, sessionState interface{}) error

	//Get populates `sessionState` with the data previously saved
	//for the given SessionID
	Get(sid SessionID, sessionState interface{}) error

	//Delete deletes all state data associated with the SessionID from the store.
	Delete(sid SessionID) error
}
