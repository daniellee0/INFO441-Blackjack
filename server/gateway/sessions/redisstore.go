package sessions

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/go-redis/redis"
)

//RedisStore represents a session.Store backed by redis.
type RedisStore struct {
	Client          *redis.Client
	SessionDuration time.Duration
}

//NewRedisStore constructs a new RedisStore
func NewRedisStore(client *redis.Client, sessionDuration time.Duration) *RedisStore {
	return &RedisStore{
		Client:          client,
		SessionDuration: sessionDuration,
	}
}

//Store implementation

//Save saves the provided `sessionState` and associated SessionID to the store.
//The `sessionState` parameter is typically a pointer to a struct containing
//all the data you want to associated with the given SessionID.
func (rs *RedisStore) Save(sid SessionID, sessionState interface{}) error {
	//TODO: marshal the `sessionState` to JSON and save it in the redis database,
	//using `sid.getRedisKey()` for the key.
	//return any errors that occur along the way.
	key := sid.getRedisKey()

	j, err := json.Marshal(sessionState)
	if nil != err {
		return err
	}

	err = rs.Client.Set(key, j, rs.SessionDuration).Err()
	if err != nil {
		return err
	}
	return nil
}

//Get populates `sessionState` with the data previously saved
//for the given SessionID
func (rs *RedisStore) Get(sid SessionID, sessionState interface{}) error {
	//TODO: get the previously-saved session state data from redis,
	//unmarshal it back into the `sessionState` parameter
	//and reset the expiry time, so that it doesn't get deleted until
	//the SessionDuration has elapsed.

	pipe := rs.Client.Pipeline()
	res := pipe.Get(sid.getRedisKey())
	expErr := pipe.Expire(sid.getRedisKey(), rs.SessionDuration).Err()
	_, pipeErr := pipe.Exec()
	if res.Err() != nil {
		return ErrStateNotFound
	}
	if expErr != nil {
		return fmt.Errorf("error changing expiration of session <%s>:\n%s", sid, expErr.Error())
	}
	if pipeErr != nil {
		return fmt.Errorf("error getting sid <%s>:\n%v", string(sid), pipeErr.Error())
	}
	err := json.Unmarshal([]byte(res.Val()), sessionState)
	if err != nil {
		return fmt.Errorf("error unmarshaling sessionState: %s", err.Error())
	}
	return nil
	//for extra-credit using the Pipeline feature of the redis
	//package to do both the get and the reset of the expiry time
	//in just one network round trip!
}

//Delete deletes all state data associated with the SessionID from the store.
func (rs *RedisStore) Delete(sid SessionID) error {
	rs.Client.Del(sid.String())
	return nil
}

//getRedisKey() returns the redis key to use for the SessionID
func (sid SessionID) getRedisKey() string {
	//convert the SessionID to a string and add the prefix "sid:" to keep
	//SessionID keys separate from other keys that might end up in this
	//redis instance
	return "sid:" + sid.String()
}
