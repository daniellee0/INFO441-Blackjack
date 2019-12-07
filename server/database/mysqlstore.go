package db

import (
	"INFO441-Blackjack/server/gateway/models/users"
	"database/sql"
	"errors"
	"fmt"

	_ "github.com/go-sql-driver/mysql" //sql driver
)

type dbStore struct {
	DB *sql.DB
}

// NewMysqlRepository will create an implementation of users.Store
func NewMysqlRepository(conn *sql.DB) users.Store {
	return &dbStore{
		DB: conn,
	}
}

// GetByID returns a user with a given id
func (store *dbStore) GetByID(id int64) (*users.User, error) {
	c := users.User{}
	if id < 0 {
		return nil, errors.New("invalid primary key")
	}
	rows := store.DB.QueryRow("SELECT * FROM Users WHERE id=?", id)

	if err := rows.Scan(&c.ID, &c.Email, &c.PassHash, &c.UserName,
		&c.FirstName, &c.LastName, &c.Chips); err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("%s", "User not found")
		}
		return nil, fmt.Errorf("error scanning row: %v", err)
	}

	return &c, nil
}

// GetByEmail returns a user with a given email
func (store *dbStore) GetByEmail(email string) (*users.User, error) {
	rows, e := store.DB.Query("SELECT * FROM Users WHERE email=?", email)
	if e != nil {
		return nil, errors.New("Failed to retrieve matching rows")
	}
	defer rows.Close()
	c := users.User{}
	for rows.Next() {
		if err := rows.Scan(&c.ID, &c.Email, &c.PassHash, &c.UserName,
			&c.FirstName, &c.LastName, &c.Chips); err != nil {
			fmt.Printf("error scanning row: %v\n", err)
		}
	}
	return &c, e
}

// GetByUserName returns a user with a given username
func (store *dbStore) GetByUserName(username string) (*users.User, error) {
	rows, e := store.DB.Query("SELECT * FROM Users WHERE username=?", username)
	if e != nil {
		return nil, errors.New("Failed to retrieve matching rows")
	}
	defer rows.Close()
	c := users.User{}
	for rows.Next() {
		if err := rows.Scan(&c.ID, &c.Email, &c.PassHash, &c.UserName,
			&c.FirstName, &c.LastName, &c.Chips); err != nil {
			fmt.Printf("error scanning row: %v\n", err)
		}
	}
	return &c, e
}

// Delete removes a User with a given id from the db
func (store *dbStore) Delete(id int64) error {
	_, e := store.DB.Exec("DELETE FROM Users WHERE id=?", id)
	if e != nil {
		return e
	}
	return e
}

// Insert a user into db
func (store *dbStore) Insert(user *users.User) (*users.User, error) {

	insertRow := "INSERT INTO Users(email, passhash, username, first_name, last_name, chips) VALUES (?,?,?,?,?,?)"
	res, e := store.DB.Exec(insertRow, user.Email, string(user.PassHash), user.UserName, user.FirstName, user.LastName, 100)
	if e != nil {
		return nil, e
	}

	// // get ID of success insert
	id, _ := res.LastInsertId()

	insertRow = "INSERT INTO Games_Players(game_id, player_id, status, hand_value) VALUES (?,?,?,?)"
	res, e = store.DB.Exec(insertRow, 1, id, "betting", 0)
	if e != nil {
		return nil, e
	}
	contact, e := store.GetByID(id)
	return contact, e
}

// Update returns a User with allowed updated profile
func (store *dbStore) Update(id int64, updates *users.Updates) (*users.User, error) {
	updateUser := "UPDATE Users SET first_name=?, last_name=? WHERE id=?"
	_, e := store.DB.Exec(updateUser, updates.FirstName, updates.LastName, id)
	if e != nil {
		return nil, e
	}
	// get user by id
	contact, e := store.GetByID(id)
	if e != nil {
		// handle is ID doesn't exist
		return nil, errors.New("Failed to retrieve matching rows")
	}
	return contact, e

}

// GetAllUsers returns all users except for the given user id
func (store *dbStore) GetAllUsers(id int64) ([]*users.User, error) {
	var allUsers []*users.User
	user, err := store.GetByID(id)
	if err != nil {
		return nil, errors.New("Failed to retrieve matching rows by id")
	}
	allUsers = append(allUsers, user)

	// Get all users
	rows, e := store.DB.Query("SELECT * FROM Users WHERE NOT id=?", id)
	if e != nil {
		return nil, errors.New("Failed to retrieve matching rows")
	}
	defer rows.Close()
	c := users.User{}
	for rows.Next() {
		if err := rows.Scan(&c.ID, &c.Email, &c.PassHash, &c.UserName,
			&c.FirstName, &c.LastName, &c.Chips); err != nil {
			fmt.Printf("error scanning row: %v\n", err)
		}
		allUsers = append(allUsers, &c)
	}
	allUsers = append(allUsers, &users.User{ID: 90, Email: "blah@gmail.com", PassHash: []byte("helo"), UserName: "ddd", FirstName: "ddd", LastName: "ddd"})
	return allUsers, e
}
