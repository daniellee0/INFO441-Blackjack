package users

import (
	"crypto/md5"
	"encoding/hex"
	"strings"
	"testing"

	"golang.org/x/crypto/bcrypt"
)

//TODO: add tests for the various functions in user.go, as described in the assignment.
//use `go test -cover` to ensure that you are covering all or nearly all of your code paths.

// Testing Rules
// Must import the testing module
// Each test function starts with a capital "Test" e.g. TestExtractSummary\
// Each test function must also have a single param (t *testing.T)
// go test -cover    for overall coverage
// go tool cover -func-=cover.out
// go tool cover -html=cover.out shows heatmap of test coverage across all functions

func TestValidate(t *testing.T) {
	cases := []struct {
		name        string
		hint        string
		User        *NewUser
		expectError bool
	}{
		{
			"Valid user",
			"This is a valid user, so this should work",
			&NewUser{Email: "alice@example.com", Password: "123456", PasswordConf: "123456", UserName: "Alice"},
			false,
		},
		{
			"Invalid Email Address",
			"Remember to make sure email address follows <name>@<domain>",
			&NewUser{Email: "@example.com", Password: "123456", PasswordConf: "123456", UserName: "Alice"},
			true,
		},
		{
			"Password less than 6 characters",
			"Ensure password is at least 6 characters",
			&NewUser{Email: "alice@example.com", Password: "1234", PasswordConf: "1234", UserName: "Alice"},
			true,
		},
		{
			"Passwords don't match",
			"Ensure password and passwordconf match",
			&NewUser{Email: "alice@example.com", Password: "123456", PasswordConf: "456789", UserName: "Alice"},
			true,
		},
		{
			"Username length zero",
			"Ensure length of username is at least one character",
			&NewUser{Email: "alice@example.com", Password: "123456", PasswordConf: "123456", UserName: ""},
			true,
		},
		{
			"Username contains whitespace ",
			"Ensure username contains no whitespace",
			&NewUser{Email: "alice@example.com", Password: "1234", PasswordConf: "1234", UserName: "A lice"},
			true,
		},
	}

	for _, c := range cases {
		err := c.User.Validate()

		if err != nil && !c.expectError {
			t.Errorf("case %s: unexpected error %v\nHINT: %s", c.name, err, c.hint)
		}
		if c.expectError && err == nil {
			t.Errorf("case %s: expected error but didn't get one\nHINT: %s", c.name, c.hint)
		}

	}
}

func TestToUser(t *testing.T) {
	hasher := md5.New()
	hasher.Write([]byte(strings.ToLower(strings.Trim("AliCE@example.com", " "))))
	photoURLHash := hex.EncodeToString(hasher.Sum(nil))
	photoURL := "https://www.gravatar.com/avatar/" + photoURLHash
	cases := []struct {
		name        string
		hint        string
		User        *NewUser
		expectError bool
	}{
		{
			"Successfully Convert NewUser to User",
			"This is a valid new user. This should work.",
			&NewUser{Email: "AliCE@example.com", Password: "password", PasswordConf: "password", UserName: "Username", FirstName: "First", LastName: "Last"},
			false,
		},
		{
			"Unsuccessfully Convert NewUser to User",
			"This is an invalid user. Double check Validate function for email.",
			&NewUser{Email: "@example.com", Password: "password", PasswordConf: "password", UserName: "Username", FirstName: "First", LastName: "Last"},
			true,
		},
	}

	for _, c := range cases {
		user, err := c.User.ToUser()

		if c.expectError && err == nil {
			t.Errorf("case %s: expected error but didn't get one\nHINT: %s", c.name, c.hint)
		}

		if err == nil && !c.expectError && (bcrypt.CompareHashAndPassword(user.PassHash, []byte("password")) != nil || user.PhotoURL != photoURL) {
			t.Errorf("case %s: unexpected error %v\nHINT: %s", c.name, err, c.hint)
		}
	}
}

func TestFullName(t *testing.T) {
	cases := []struct {
		name         string
		hint         string
		User         *User
		expectedName string
	}{
		{
			"First and Last",
			"The full name should include both the first and last, separated by a single space between",
			&User{Email: "alice@example.com", FirstName: "First", LastName: "Last"},
			"First Last",
		},
		{
			"Just First",
			"The full name should be just the first name with no space",
			&User{Email: "@example.com", FirstName: "First"},
			"First",
		},
		{
			"Just Last",
			"The full name should be just the last name with no space",
			&User{Email: "alice@example.com", LastName: "Last"},
			"Last",
		},
		{
			"Blank Full Name",
			"The full name should be an empty string",
			&User{Email: "alice@example.com"},
			"",
		},
	}

	for _, c := range cases {
		fullName := c.User.FullName()

		if fullName != c.expectedName {
			t.Errorf("case %s: unexpected error \nHINT: %s", c.name, c.hint)
		}
	}
}

func TestAuthenticate(t *testing.T) {
	passHash, _ := bcrypt.GenerateFromPassword([]byte("password"), 13)
	incorrectPassHash, _ := bcrypt.GenerateFromPassword([]byte("ppaasswwoorrdd"), 13)
	cases := []struct {
		name        string
		hint        string
		User        *User
		password    string
		expectError bool
	}{
		{
			"Successful Authentication",
			"The plaintext password should match the stored hash. Matching passwords.",
			&User{Email: "alice@example.com", PassHash: passHash},
			"password",
			false,
		},
		{
			"Unsuccessful Authentication",
			"The plaintext password should match the stored hash. Different passwords.",
			&User{Email: "@example.com", PassHash: incorrectPassHash},
			"password",
			true,
		},
		{
			"Unsuccessful Authentication",
			"The plaintext password should match the stored hash. Password is not empty.",
			&User{Email: "@example.com", PassHash: incorrectPassHash},
			"",
			true,
		},
	}

	for _, c := range cases {
		err := c.User.Authenticate(c.password)

		if err != nil && !c.expectError {
			t.Errorf("case %s: unexpected error %v\nHINT: %s", c.name, err, c.hint)
		}
		if c.expectError && err == nil {
			t.Errorf("case %s: expected error but didn't get one\nHINT: %s", c.name, c.hint)
		}
	}
}

func TestApplyUpdates(t *testing.T) {
	cases := []struct {
		name        string
		hint        string
		User        *User
		updates     *Updates
		expectError bool
	}{
		{
			"Successfully Apply Updates",
			"The fields of the user should be updated to the values of the update struct",
			&User{Email: "alice@example.com", FirstName: "First", LastName: "Last"},
			&Updates{FirstName: "NewFirst", LastName: "NewLast"},
			false,
		},
		{
			"Unsuccessfuly Apply Updates",
			"The fields of the user should not be updated to the values of the update struct. Invalid UTF-8",
			&User{Email: "@example.com", FirstName: "First", LastName: "Last"},
			&Updates{FirstName: string([]byte{0xff, 0xfe, 0xfd}), LastName: string([]byte{0xff, 0xfe, 0xfd})},
			true,
		},
	}

	for _, c := range cases {
		err := c.User.ApplyUpdates(c.updates)

		if err != nil && !c.expectError {
			t.Errorf("case %s: unexpected error %v\nHINT: %s", c.name, err, c.hint)
		}
		if c.expectError && err == nil {
			t.Errorf("case %s: expected error but didn't get one\nHINT: %s", c.name, c.hint)
		}
		if !c.expectError && err == nil && (c.User.FirstName != c.updates.FirstName || c.User.LastName != c.updates.LastName) {
			t.Errorf("case %s: unexpected error %v\nHINT: %s", c.name, err, c.hint)
		}
	}
}
