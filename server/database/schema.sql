create table if not exists Users (
    id int not null auto_increment primary key,
    `name` varchar(255) unique not null,
    `status` varchar(64) not null,
    chips int not null,
    cards varchar(255) not null
);