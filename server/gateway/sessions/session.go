package sessions

import (
	"errors"
	"net/http"
)

const headerAuthorization = "Authorization"
const paramAuthorization = "auth"
const schemeBearer = "Bearer "

//ErrNoSessionID is used when no session ID was found in the Authorization header
var ErrNoSessionID = errors.New("no session ID found in " + headerAuthorization + " header")

//ErrInvalidScheme is used when the authorization scheme is not supported
var ErrInvalidScheme = errors.New("authorization scheme not supported")

//BeginSession creates a new SessionID, saves the `sessionState` to the store, adds an
//Authorization header to the response with the SessionID, and returns the new SessionID
func BeginSession(signingKey string, store Store, sessionState interface{}, w http.ResponseWriter) (SessionID, error) {
	//TODO:

	//- create a new SessionID
	sid, err := NewSessionID(signingKey)
	if err != nil {
		return InvalidSessionID, err
	}

	//- save the sessionState to the store
	store.Save(sid, sessionState)

	//- add a header to the ResponseWriter that looks like this:
	//    "Authorization: Bearer <sessionID>"
	//  where "<sessionID>" is replaced with the newly-created SessionID
	//  (note the constants declared for you above, which will help you avoid typos)
	w.Header().Add(headerAuthorization, schemeBearer+sid.String())

	return sid, nil
}

//GetSessionID extracts and validates the SessionID from the request headers
func GetSessionID(r *http.Request, signingKey string) (SessionID, error) {
	//TODO: get the value of the Authorization header,
	//or the "auth" query string parameter if no Authorization header is present,
	//and validate it.
	sid, err := GetSID(r, signingKey)
	if nil != err {
		return InvalidSessionID, err
	}

	//If it's valid, return the SessionID. If not
	//return the validation error.
	_, valErr := ValidateID(sid.String(), signingKey)
	if nil != valErr {
		return InvalidSessionID, valErr
	}
	return sid, nil
}

//GetState extracts the SessionID from the request,
//gets the associated state from the provided store into
//the `sessionState` parameter, and returns the SessionID
func GetState(r *http.Request, signingKey string, store Store, sessionState interface{}) (SessionID, error) {
	//TODO: get the SessionID from the request, and get the data
	//associated with that SessionID from the store.
	sid, err := GetSessionID(r, signingKey)
	if nil != err {
		return InvalidSessionID, err
	}

	storeErr := store.Get(sid, sessionState)

	if nil != storeErr {
		return InvalidSessionID, storeErr
	}

	return sid, nil
}

//EndSession extracts the SessionID from the request,
//and deletes the associated data in the provided store, returning
//the extracted SessionID.
func EndSession(r *http.Request, signingKey string, store Store) (SessionID, error) {
	//TODO: get the SessionID from the request, and delete the
	//data associated with it in the store.
	sid, err := GetSessionID(r, signingKey)
	if nil != err {
		return InvalidSessionID, err
	}

	store.Delete(sid)

	return sid, nil
}

//GetSID takes in HTTP Request, and returns the SessionID from its header.
//Returns invalid session ID and error if header does not contain proper
//scheme prefix, or has mismatched "auth" header key
func GetSID(r *http.Request, signingKey string) (SessionID, error) {
	unparsedSID := r.Header.Get(headerAuthorization)

	if len(unparsedSID) < 1 {
		unparsedSID = r.URL.Query().Get(paramAuthorization)
	}

	if len(unparsedSID) < 1 {
		return InvalidSessionID, ErrNoSessionID
	}

	return ParseSID(unparsedSID, signingKey)
}

//ParseSID takes in unparsed Authorization value from header,
//and returns its SessionID.
//Returns invalid session ID and error if header does not contain proper
//scheme prefix.
func ParseSID(sid string, signingKey string) (SessionID, error) {
	// parsedString := strings.Fields(s)
	// if (parsedString[0] + " ") != schemeBearer {
	// 	return InvalidSessionID, ErrInvalidScheme
	// }
	sid = sid[len(schemeBearer):]

	resultSID, err := ValidateID(sid, signingKey)
	if err != nil {
		return InvalidSessionID, err
	}

	// return SessionID(parsedString[1]), nil
	return resultSID, nil
}
