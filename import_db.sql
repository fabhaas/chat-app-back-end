DROP TABLE IF EXISTS tokens;
DROP TABLE IF EXISTS groups_users;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS groups;

CREATE TABLE users (
	id SERIAL PRIMARY KEY,
	name VARCHAR(255) UNIQUE,
	passwordHash CHAR(128),
	salt CHAR(2048),
    creationTime TIMESTAMP
);

CREATE TABLE tokens (
	id SERIAL PRIMARY KEY,
	userID INT,
    token CHAR(2048),
    FOREIGN KEY (userID) REFERENCES users(id)
);

CREATE TABLE groups (
	id SERIAL PRIMARY KEY,
	name VARCHAR(255)
)
;

CREATE TABLE groups_users (
	userID INT,
	groupID INT,
	CONSTRAINT PK_groups_users PRIMARY KEY (userID, groupID)
);