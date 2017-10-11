
CREATE DATABASE cs527;

USE cs527;

CREATE TABLE Tweets(
       user_name varchar(255),
       text varchar(255),
       id int NOT NULL AUTO_INCREMENT,
       PRIMARY KEY (id)
);
