# INFO 441 Final Project Proposal

Group Members: Lilian Mburu, Nikolai F. Nilsen, Daniel Lee

Our final project will be targeting users would enjoy playing blackjack.Users will be able to play
blackjack online against a dealer. Blackjack is a simple card game that focuses more on skill than luck.
New users to the game will benefit by learning the basics of the game. On the other hand,
experienced users with time to kill will benefit from an ad-free place to mindlessly play a round or
two.

As developers this project will provide the opportunities to practice and polish the skills learnt. We would also find that completing a  task using a simplified and well known example will be challenging yet rewarding. Working on a project that can be scaled up or down depending on project complexities motivates us to work on this application. Finally, working on a project that requires a diverse set of skills and that is also fun is a great way to exercise our skills as developers. 

# Scope

Our primary objective is to be able to create a simple blackjack server over websockets. It will contain
a client in order to interface with the blackjack server. Our goal is to create a working client that can
run through several hands against a dealer without any hiccups.
**_Stretch goals:_**

1. Add client vs client game sessions functionality
2. Add multiple games to the project
3. Add chat feature


# Technical Description
![image](https://i.imgur.com/Yqn3X9T.png)
# User Stories

| Priority          | User               | Description                                                                                                                                                                                                                                                                                                                                               |
|-------------------|--------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| P1                | As a player        | I want to register for a game session. Utilizing **RedisDB** to create and authenticate user sessions and the Blackjack docker Game Service **microservice** to update game sessions as necessary.                                                                                                                                                        |
| P0 (MVP)          | As a player        | I want to place a bet on the next hand when I interact with the chips. Utilizing **Websockets** and the Blackjack game **microservice** to allow the user to place a bet and subsequently start the round (Game Service notifies the user that the round has started).                                                                                    |
| P0 (MVP)          | As a player        | I want to stand with my current hand when I request to stand. Utilizing **Websockets** and the Blackjack docker game **microservice** to allow the user to stand with their current hand. The game service would respond by notifying the user that they’re standing.                                                                                     |
| P0 (MVP)          | As a player        | I want to be dealt a card when I request to hit. Utilizing **Websockets** and the Blackjack docker game **microservice** to allow the user to be dealt a card when they request to hit. The game service would respond by notifying the user that they are being dealt a new card and will proceed to respond with the new card.                          |
| P0 (MVP)          | As a player        | I want to beat the dealer when the dealer draws a hand that goes over 21. Utilizing **Websockets** and the Blackjack docker game **microservice** to allow the user to be dealt a card when they request to hit. The game service would respond by notifying the user that they are being dealt a new card and will proceed to respond with the new card. |
| P0 (MVP)          | As a player        | I want to beat the dealer when I draw a hand of 21 on the first two cards when the dealer does not. Utilizing **Websockets** and the Blackjack docker game **microservice** to notify the user that they have beaten the dealer. The game service will process winning/losing hands when the cards are dealt and notify all users in the game.            |
| P0 (MVP)          | As a player        | I want to lose to the dealer when I draw a hand that exceeds 21. Utilizing **Websockets** and the Blackjack docker game **microservice** to notify the user that they have lost to the dealer. The game service will process winning/losing hands when the cards are dealt and notify all users in the game.                                              |
| P0 (MVP)          | As a player        | I want to lose to the dealer when the dealer’s hand is greater in value than mine at the end of the round. Utilizing **Websockets** and the Blackjack docker game **microservice** to notify the user that they have lost to the dealer. The game service will process winning/losing hands when the cards are dealt and notify all users in the game.    |
| P0 (MVP)          | As a player        | I want to live-chat where other players can see messages that I send and vice versa. Utilizing **Websockets** and the Live chat docker **microservice** to allow users to interact by sending and receiving messages from other users playing the game in real time.                                                                                      |
| P0 (MVP)          | As a player/Dealer | I want to be dealt cards from a traditional 52 card deck. The blackjack docker game **microservice** will ensure that only a traditional 52 card deck is being used.                                                                                                                                                                                      |
| P2 (stretch goal) | As a player        | I want to register as a new user. Will utilize **REST API** to create new accounts and stored in **MySQL** database                                                                                                                                                                                                                                       |
| P2 (stretch goal) | As a player        | I want to sign out as an existing user. Will utilize **REST API** to sign out by making a request to `v1/Users/{userid}/SignOut`                                                                                                                                                                                                                          |
| P2 (stretch goal) | As a player        | I want to retrieve and view a list of all games. Will utilize **REST API** and **MySQL** database                                                                                                                                                                                                                                                         |
| P2 (stretch goal) | As a player        | I want to retrieve chat info from a game during a particular session. Will utilize **REST API, REDIS, and MySQL** database                                                                                                                                                                                                                                |
# Endpoints

**`/v1/users/register`:** ​Register a user for the current game session

**`/v1/users/signup`:** ​Sign up a new user

**`/v1/games/{GameID}`:** ​Add new message to the game.

**`/v1/Users/{userid}/unregister`:** ​ Unregister a user for the current game session

**`/v1/games/{GameID}/Users/{UserID}/bet`:** ​ Place a bet on the next hand

**`/v1/games/{GameID}/Users/{UserID}/hit`:** ​ Execute a given hand

**`v1/games/{GameID}/Users/{UserID}/stand`:** ​Execute a given hand


## Stretch goals:

**`v1/Users/SignUp`:** ​register a new user

**`v1/Users/{userid}/SignOut`:** ​sign out existing user

**`v1/Games`:** ​ retrieve a list of all games


**`v1/Games/{gameid}/Sessions/{sessionid}/Chat`:** ​Retrieve chat info from a game during particular
session


