DROP TABLE IF EXISTS tokens;
DROP TABLE IF EXISTS groups_users;
DROP TABLE IF EXISTS groups;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
	id SERIAL PRIMARY KEY,
	name VARCHAR(255) UNIQUE,
	passwordHash CHAR(128),
	salt CHAR(2048),
    creationTime TIMESTAMP
);

CREATE TABLE tokens (
	userID INT,
    token CHAR(2048),
    FOREIGN KEY (userID) REFERENCES users(id),
	CONSTRAINT PK_tokens PRIMARY KEY (userID, token)
);

CREATE TABLE groups (
	id SERIAL PRIMARY KEY,
	name VARCHAR(255),
	ownerID INT,
	UNIQUE (name, ownerID),
	FOREIGN KEY (ownerID) REFERENCES users(id)
);

CREATE TABLE groups_users (
	userID INT,
	groupID INT,
	isConfirmed BOOLEAN,
	CONSTRAINT PK_groups_users PRIMARY KEY (userID, groupID)
);

GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO chatuser;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO chatuser;