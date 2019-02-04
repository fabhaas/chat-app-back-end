# ChatApp- back-end
## Installation

### Database setup
Install [PostgreSQL](https://www.postgresql.org/)(tested with version 11, but older versions may work).

Create the user "chatuser" on the database: 
```sql
CREATE USER chatuser WITH PASSWORD 'chatUserPassword!10?';
```
You can choose a diffrent password, but make sure to change it as well in the config.json file.

Create the database "chat" owned by "chatuser":
```sql
CREATE DATABASE chat OWNER chatuser ENCODING 'UTF8';
```

Grant all rigths on the database to "chatuser":
```sql
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO chatuser;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO chatuser;
```

Run import_db.sql.

### Server setup
Install [NodeJS](https://nodejs.org/en/).

Run `npm install` in the main directory.

### Test setup
Install [Python 3](https://www.python.org/), including pip. For Windows only: add Python and pip to the PATH enviroment variable.

Run `pip install requests psycopg2`.

## Running server
Run `npm start`. The server should output the ports where it listens.

## Running test
---WARNING: the tests do not test the complete API---
Go in to the "test" directory.

Run `python test_server.py`.
