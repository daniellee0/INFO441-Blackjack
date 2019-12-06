create table if not exists Users (
    id int not null auto_increment primary key,
    email varchar(254) unique not null,
    passhash varchar(60) not null, 
    username varchar(255) unique not null,
    first_name varchar(64) not null,
    last_name varchar(128) not null, 
    chips int not null default 0
);

create table if not exists Games (
    id int not null auto_increment primary key,
    game_state varchar(255) not null
);

create table if not exists Games_Players (
    id int not null auto_increment primary key,
    game_id int not null,
    player_id int not null,
    `status` varchar(64) not null,
    hand_value int default 0,
    foreign key (`game_id`) references `Games`(`id`) on delete cascade,
    foreign key (`player_id`) references `Users`(`id`) on delete cascade
);

create table if not exists Cards (
    id int not null auto_increment primary key,
    card_name varchar(255) unique not null,
    card_value varchar(255) not null,
    card_suit varchar(255) not null
);

create table if not exists Users_Cards (
    id int not null auto_increment primary key,
    player_id int not null, 
    card_id int not null, 
    foreign key (`player_id`) references `Users`(`id`) on delete cascade,
    foreign key (`card_id`) references `Cards`(`id`) on delete cascade
);

create table if not exists Rooms (
    id int not null AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255), 
    `description` TEXT(65535)
);

create table if not exists Messages(
    id int NOT NULL AUTO_INCREMENT PRIMARY KEY, 
    game_id int not null,
    body TEXT(65535),
    foreign key (game_id) references Games(id) on delete cascade 
);

INSERT INTO Users (email, passhash, username, first_name, last_name,  chips) VALUES
    ("email@email.com", "passhash", "House", "House", "House", 100);

INSERT INTO Cards (card_name, card_value, card_suit) VALUES 
    ("AH", "A", "Hearts"),
    ("2H", "2", "Hearts"),
    ("3H", "3", "Hearts"),
    ("4H", "4", "Hearts"),
    ("5H", "5", "Hearts"),
    ("6H", "6", "Hearts"),
    ("7H", "7", "Hearts"),
    ("8H", "8", "Hearts"),
    ("9H", "9", "Hearts"),
    ("10H", "10", "Hearts"),
    ("JH", "10", "Hearts"),
    ("QH", "10", "Hearts"),
    ("KH", "10", "Hearts"),
    ("AD", "A", "Diamonds"),
    ("2D", "2", "Diamonds"),
    ("3D", "3", "Diamonds"),
    ("4D", "4", "Diamonds"),
    ("5D", "5", "Diamonds"),
    ("6D", "6", "Diamonds"),
    ("7D", "7", "Diamonds"),
    ("8D", "8", "Diamonds"),
    ("9D", "9", "Diamonds"),
    ("10D", "10", "Diamonds"),
    ("JD", "10", "Diamonds"),
    ("QD", "10", "Diamonds"),
    ("KD", "10", "Diamonds"),
    ("AS", "A", "Spades"),
    ("2S", "2", "Spades"),
    ("3S", "3", "Spades"),
    ("4S", "4", "Spades"),
    ("5S", "5", "Spades"),
    ("6S", "6", "Spades"),
    ("7S", "7", "Spades"),
    ("8S", "8", "Spades"),
    ("9S", "9", "Spades"),
    ("10S", "10", "Spades"),
    ("JS", "10", "Spades"),
    ("QS", "10", "Spades"),
    ("KS", "10", "Spades"),
    ("AC", "A", "Clubs"),
    ("2C", "2", "Clubs"),
    ("3C", "3", "Clubs"),
    ("4C", "4", "Clubs"),
    ("5C", "5", "Clubs"),
    ("6C", "6", "Clubs"),
    ("7C", "7", "Clubs"),
    ("8C", "8", "Clubs"),
    ("9C", "9", "Clubs"),
    ("10C", "10", "Clubs"),
    ("JC", "10", "Clubs"),
    ("QC", "10", "Clubs"),
    ("KC", "10", "Clubs");

