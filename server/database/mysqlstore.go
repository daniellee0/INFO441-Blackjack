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
func (store *dbStore) GetAllUsers(id int64) ([]*users.Player, error) {
	var allUsers []*users.Player
	// user, err := store.GetByID(id)
	// if err != nil {
	// 	return nil, errors.New("Failed to retrieve matching rows by id")
	// }
	// allUsers = append(allUsers, user)

	p := users.Player{}
	// Get the given user
	grows, e := store.DB.Query("SELECT u.id, u.username, u.first_name, u.last_name, u.chips, gp.status FROM Users u JOIN Games_Players gp on u.id=gp.player_id WHERE u.id=?", id)
	if e != nil {
		fmt.Printf("%s", e)
		return nil, errors.New("Failed to retrieve matching rows")
	}
	defer grows.Close()
	for grows.Next() {
		if err := grows.Scan(&p.ID, &p.UserName,
			&p.FirstName, &p.LastName, &p.Chips, &p.Status); err != nil {
			fmt.Printf("error scanning row: %v\n", err)
		}
		// Retrive players cards
		gplayerCardRows, e := store.DB.Query("SELECT c.card_name FROM Users_Cards uc JOIN Cards c on uc.card_id = c.id WHERE uc.player_id=?", id)
		if e != nil {
			fmt.Printf("error getting row all players")
			return nil, errors.New("Failed to retrieve matching rows")
		}
		defer gplayerCardRows.Close()
		var cards []string
		var card string
		for gplayerCardRows.Next() {
			if err := gplayerCardRows.Scan(&card); err != nil {
				fmt.Printf("error scanning row: %v\n", err)
			}
			cards = append(cards, card)
		}
		// Add cards to player struct
		p.Cards = cards
		allUsers = append(allUsers, &p)
	}

	// Get all users that aren't the given one
	rows, uerr := store.DB.Query("SELECT u.id, u.username, u.first_name, u.last_name, u.chips, gp.status FROM Users u JOIN Games_Players gp on u.id=gp.player_id WHERE NOT u.id=?", id)
	if uerr != nil {
		return nil, errors.New("Failed to retrieve matching rows")
	}
	defer rows.Close()
	for rows.Next() {
		pl := users.Player{}
		if err := rows.Scan(&pl.ID, &pl.UserName,
			&pl.FirstName, &pl.LastName, &pl.Chips, &pl.Status); err != nil {
			fmt.Printf("error scanning row: %v\n", err)
		}
		playerCardRows, e := store.DB.Query("SELECT c.card_name FROM Users_Cards uc JOIN Cards c on uc.card_id = c.id WHERE player_id=?", pl.ID)
		defer playerCardRows.Close()
		var cards []string
		var card string
		if e != nil {
			return nil, errors.New("Failed to retrieve matching rows")
		}
		// Retrive players cards
		for playerCardRows.Next() {
			if err := playerCardRows.Scan(&card); err != nil {
				fmt.Printf("error scanning row: %v\n", err)
			}
			cards = append(cards, card)
		}
		// Add cards to player struct
		pl.Cards = cards
		allUsers = append(allUsers, &pl)
		// Reset cards
	}
	return allUsers, e
}

func (store *dbStore) GetGameState(gameID int, playerID int64) (*users.GameState, error) {
	selectRow := "SELECT game_state from Games WHERE id=?"
	rows, e := store.DB.Query(selectRow, gameID)
	if e != nil {
		return nil, errors.New("Failed to retrieve matching rows")
	}
	gs := users.GameState{}
	for rows.Next() {
		if err := rows.Scan(&gs.Status); err != nil {
			fmt.Printf("error scanning row: %v\n", err)
		}
	}
	players, err := store.GetAllUsers(playerID)
	if err != nil {
		return nil, errors.New("Failed to retrieve all users")
	}
	gs.Players = players
	return &gs, nil
}

// Adds user to the game on login
func (store *dbStore) AddUserToGame(id int64) error {
	// Add user to the game
	insertRow := "INSERT INTO Games_Players(game_id, player_id, status, bet_amount) VALUES (?,?,?,?)"
	_, e := store.DB.Exec(insertRow, 1, id, "betting", 0)
	if e != nil {
		fmt.Println(e)
		return e
	}

	// Insert temp card
	insertRow = "INSERT INTO Users_Cards(player_id, card_id) VALUES (?,?)"
	_, e = store.DB.Exec(insertRow, id, 53)
	if e != nil {
		fmt.Println("failed to insert into cards")
		return e
	}

	// Check if the player can bet
	// var gameState string
	// rows, err := store.DB.Query("SELECT game_state FROM GAMES WHERE id=1")
	// if err != nil {
	// 	log.Fatal(err)
	// }
	// defer rows.Close()
	// for rows.Next() {
	// 	err := rows.Scan(&gameState)
	// 	if err != nil {
	// 		log.Fatal(err)
	// 	}
	// 	if gameState == "betting" {
	// 		// do nothing
	// 	}
	// }

	return nil
}
