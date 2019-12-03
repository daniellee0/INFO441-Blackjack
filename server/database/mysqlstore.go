package database

import (
	"database/sql"
	"errors"
	"fmt"

	_ "github.com/go-sql-driver/mysql" //sql driver
	users "INFO441-Blackjack/server/gateway/models/users"
)

type dbStore struct {
	DB *sql.DB
}

// NewMysqlRepository 
func NewMysqlRepository(conn *sql.DB) users.Store {
	return &dbStore{
		DB: conn,
	}
}


// Insert a user into db
func (store *dbStore) Insert(user *users.User) (*users.User, error) {
	insertRow := "INSERT INTO Users(name, status, chips, cards) VALUES (?,?,?,?)"
	res, e := store.DB.Exec(insertRow, user.Name, user.Status, user.Chips, user.Cards)
	if e != nil {
		return nil, e
	}

	// // get ID of success insert
	id, _ := res.LastInsertId()
	contact, e := store.GetByID(id)
	return contact, e
}