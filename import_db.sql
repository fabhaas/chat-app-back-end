USE chat;
--DROP TABLE tokens;
--DROP TABLE users;
CREATE TABLE users (
	id INT PRIMARY KEY AUTO_INCREMENT,
	name VARCHAR(255),
	passwordHash CHAR(128),
	salt CHAR(2048),
    creationTime DateTime
);

CREATE TABLE tokens (
	userID INT,
    token VARCHAR(512),
    CONSTRAINT PK_tokens PRIMARY KEY (userID, token),
    FOREIGN KEY (userID) REFERENCES users(id)
);