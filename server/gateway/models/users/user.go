package users

import (
	"crypto/md5"
	"errors"
	"net/mail"
	"strings"
	"unicode/utf8"

	"golang.org/x/crypto/bcrypt"
)

//bcryptCost is the default bcrypt cost to use when hashing passwords
var bcryptCost = 13

//User represents a user account in the database
type User struct {
	ID        int64  `json:"id"`
	Email     string `json:"-"` //never JSON encoded/decoded
	PassHash  []byte `json:"-"` //never JSON encoded/decoded
	UserName  string `json:"userName"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
}

//Credentials represents user sign-in credentials
type Credentials struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

//NewUser represents a new user signing up for an account
type NewUser struct {
	Email        string `json:"email"`
	Password     string `json:"password"`
	PasswordConf string `json:"passwordConf"`
	UserName     string `json:"userName"`
	FirstName    string `json:"firstName"`
	LastName     string `json:"lastName"`
}

//Updates represents allowed updates to a user profile
type Updates struct {
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
}

//Validate validates the new user and returns an error if
//any of the validation rules fail, or nil if its valid
func (nu *NewUser) Validate() error {
	//TODO: validate the new user according to these rules:
	//- Email field must be a valid email address (hint: see mail.ParseAddress)
	//- Password must be at least 6 characters
	//- Password and PasswordConf must match
	//- UserName must be non-zero length and may not contain spaces
	//use fmt.Errorf() to generate appropriate error messages if
	//the new user doesn't pass one of the validation rules
	_, err := mail.ParseAddress(nu.FirstName + " " + nu.LastName + "<" + nu.Email + ">")
	if err != nil {
		return errors.New("Invalid Email Address")
	}
	if len(nu.Password) < 6 {
		return errors.New("Password is less than 6 characters")
	}
	if nu.Password != nu.PasswordConf {
		return errors.New("Password and PasswordConf do not match")
	}
	if len(nu.UserName) < 1 || strings.Contains(nu.UserName, " ") {
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
	e, _ := mail.ParseAddress(nu.Email)
	hasher := md5.New()
	hasher.Write([]byte(strings.ToLower(strings.Trim(e.Address, " "))))
	user := &User{Email: nu.Email, UserName: nu.UserName, FirstName: nu.FirstName,
		LastName: nu.LastName}
	passErr := user.SetPassword(nu.Password)
	if passErr != nil {
		return nil, passErr
	}
	return user, nil
}

//FullName returns the user's full name, in the form:
// "<FirstName> <LastName>"
//If either first or last name is an empty string, no
//space is put between the names. If both are missing,
//this returns an empty string
func (u *User) FullName() string {
	//TODO: implement according to comment above
	if u.FirstName != "" && u.LastName != "" {
		return u.FirstName + " " + u.LastName
	} else if u.FirstName == "" && u.LastName != "" {
		return u.LastName
	} else if u.FirstName != "" && u.LastName == "" {
		return u.FirstName
	}
	return ""
}

//SetPassword hashes the password and stores it in the PassHash field
func (u *User) SetPassword(password string) error {
	//TODO: use the bcrypt package to generate a new hash of the password
	//https://godoc.org/golang.org/x/crypto/bcrypt
	passHash, err := bcrypt.GenerateFromPassword([]byte(password), bcryptCost)
	if err != nil {
		return err
	}
	u.PassHash = passHash
	return nil
}

//Authenticate compares the plaintext password against the stored hash
//and returns an error if they don't match, or nil if they do
func (u *User) Authenticate(password string) error {
	if password == "" {
		return errors.New("Invalid password")
	}
	err := bcrypt.CompareHashAndPassword(u.PassHash, []byte(password))
	if err != nil {
		return err
	}
	return nil
}

//ApplyUpdates applies the updates to the user. An error
//is returned if the updates are invalid
func (u *User) ApplyUpdates(updates *Updates) error {
	//TODO: set the fields of `u` to the values of the related
	//field in the `updates` struct
	if !utf8.ValidString(updates.FirstName) || !utf8.ValidString(updates.LastName) {
		return errors.New("Updates are invalid")
	}
	u.FirstName = updates.FirstName
	u.LastName = updates.LastName
	return nil
}
