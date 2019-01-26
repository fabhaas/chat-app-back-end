# back-end
## API
### registration
POST /register/:name := register user with name -> returns statuscode 201 when successful
                                                -> returns statuscode 409 when user already exists
    body: "{ 'password': '<password>' }"
    
### login
POST /login/:name -> login user -> returns statuscode 200 when successful
                                -> returns statuscode 400 when login failed
    body: "{ 'password': '<password>' }"

