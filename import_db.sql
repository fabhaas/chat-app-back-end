DROP TABLE IF EXISTS tokens;
DROP TABLE IF EXISTS groups_users;
DROP TABLE IF EXISTS groups;
DROP TABLE IF EXISTS friends;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
	id SERIAL PRIMARY KEY,
	name VARCHAR(255) UNIQUE,
	passwordHash CHAR(128),
	salt CHAR(2048),
    creationTime TIMESTAMP
);

CREATE TABLE tokens (
	userID INT REFERENCES users(id),
    token CHAR(2048),
	PRIMARY KEY (userID, token)
);

CREATE TABLE groups (
	id SERIAL PRIMARY KEY,
	name VARCHAR(255),
	ownerID INT REFERENCES users(id),
	UNIQUE (name, ownerID)
);

CREATE TABLE groups_users (
	userID INT REFERENCES users(id),
	groupID INT REFERENCES groups(id),
	isAccepted BOOLEAN,
	PRIMARY KEY (userID, groupID)
);

CREATE TABLE friends (
	userID INT REFERENCES users(id),
	friendID INT REFERENCES users(id),
	isAccepted BOOLEAN,
	PRIMARY KEY (userID, friendID)
);

GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO chatuser;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO chatuser;