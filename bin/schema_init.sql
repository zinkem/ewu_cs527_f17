
CREATE DATABASE cs527;

USE cs527;

CREATE TABLE tweets(
       create_time int(8),
       user_name varchar(255),
       text varchar(255),
       id bigint NOT NULL,
       PRIMARY KEY (id)
);

CREATE TABLE users(
       screen_name varchar(255) NOT NULL,
       followers int DEFAULT 0,
       friends int DEFAULT 0,
       id int NOT NULL AUTO_INCREMENT,
       PRIMARY KEY (id),
       UNIQUE(screen_name)
);

CREATE TABLE hashtags(
       label varchar(255) NOT NULL,
       tweet_id bigint NOT NULL,
       FOREIGN KEY (tweet_id) references tweets(id)
);
