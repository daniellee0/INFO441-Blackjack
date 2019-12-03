package users

import(
	"strings"
	"errors"
)

//User represents a user account in the database
type User struct {
	ID        int64  `json:"id"`
	Name  string `json:"name"`
	Status string `json:"status"`
	Chips  int `json:"chips"`
	Cards  []string `json:"cards"`
}

//NewUser represents a new user signing up for an account
type NewUser struct {
	Name  string `json:"name"`
	Status string `json:"status"`
	Chips  int `json:"chips"`
	Cards  []string `json:"cards"`
}

//Validate validates the new user and returns an error if
//any of the validation rules fail, or nil if its valid
func (nu *NewUser) Validate() error {
	if len(nu.Name) < 1 || strings.Contains(nu.Name, " ") {
		return errors.New("UserName length is zero or contains spaces")
	}
	return nil
}

//ToUser converts the NewUser to a User
func (nu *NewUser) ToUser() (*User, error) {
	err := nu.Validate()
	if err != nil {
		return nil, err
	}
	
	user := &User{Name: nu.Name, Status: nu.Status, Chips: nu.Chips, Cards: nu.Cards}
	return user, nil
}

