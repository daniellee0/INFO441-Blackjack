create table if not exists Users (
    id int not null auto_increment primary key,
    email varchar(254) unique not null,
    passhash varchar(60) not null, 
    username varchar(255) unique not null,
    first_name varchar(64) not null,
    last_name varchar(128) not null, 
    chips int not null default 0
);

create table if not exists Users_Cards (
    id int not null auto_increment primary key,
    player_id int foreign key references Users(id),
    card_id int foreign key references Cards(id)
);

create table if not exists Games (
    id int not null auto_increment primary key,
    game_state varchar(255) not null
);

create table if not exists Games_Players (
    id int not null auto_increment primary key,
    game_id int foreign key references Games(id),
    player_id int foreign key references Users(id),
    `status` varchar(64) not null,
    hand_value int default 0
);

create table if not exists Cards (
    id int not null auto_increment primary key,
    card_name varchar(255) unique not null,
    card_value varchar(255) not null,
    card_suit varchar(255) not null
);

create table if not exists Rooms (
    id int not null AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255), 
    `description` TEXT(65535)
);

create table if not exists Messages(
    id int NOT NULL AUTO_INCREMENT PRIMARY KEY, 
    game_id int foreign key references Games(id), 
    body TEXT(65535)
);

INSERT INTO Users (id, email, passhash, username, first_name, last_name, `status`, chips) VALUES
    (1, "email@email.com", "passhash", "House", "House", "House", "hit", 100);

INSERT INTO Cards (id, card_name, card_value, card_suit) VALUES 
    (1, "AH", "A", "Hearts"),
    (2, "2H", "2", "Hearts"),
    (3, "3H", "3", "Hearts"),
    (4, "4H", "4", "Hearts"),
    (5, "5H", "5", "Hearts"),
    (6, "6H", "6", "Hearts"),
    (7, "7H", "7", "Hearts"),
    (8, "8H", "8", "Hearts"),
    (9, "9H", "9", "Hearts"),
    (10, "10H", "10", "Hearts"),
    (11, "JH", "10", "Hearts"),
    (12, "QH", "10", "Hearts"),
    (13, "KH", "10", "Hearts"),
    (14, "AD", "A", "Diamonds"),
    (15, "2D", "2", "Diamonds"),
    (16, "3D", "3", "Diamonds"),
    (17, "4D", "4", "Diamonds"),
    (18, "5D", "5", "Diamonds"),
    (19, "6D", "6", "Diamonds"),
    (20, "7D", "7", "Diamonds"),
    (21, "8D", "8", "Diamonds"),
    (22, "9D", "9", "Diamonds"),
    (23, "10D", "10", "Diamonds"),
    (24, "JD", "10", "Diamonds"),
    (25, "QD", "10", "Diamonds"),
    (26, "KD", "10", "Diamonds"),
    (27, "AS", "A", "Spades"),
    (28, "2S", "2", "Spades"),
    (29, "3S", "3", "Spades"),
    (30, "4S", "4", "Spades"),
    (31, "5S", "5", "Spades"),
    (32, "6S", "6", "Spades"),
    (33, "7S", "7", "Spades"),
    (34, "8S", "8", "Spades"),
    (35, "9S", "9", "Spades"),
    (36, "10S", "10", "Spades"),
    (37, "JS", "10", "Spades"),
    (38, "QS", "10", "Spades"),
    (39, "KS", "10", "Spades"),
    (40, "AC", "A", "Clubs"),
    (41, "2C", "2", "Clubs"),
    (42, "3C", "3", "Clubs"),
    (43, "4C", "4", "Clubs"),
    (44, "5C", "5", "Clubs"),
    (45, "6C", "6", "Clubs"),
    (46, "7C", "7", "Clubs"),
    (47, "8C", "8", "Clubs"),
    (48, "9C", "9", "Clubs"),
    (49, "10C", "10", "Clubs"),
    (50, "JC", "10", "Clubs"),
    (51, "QC", "10", "Clubs"),
    (52, "KC", "10", "Clubs");

