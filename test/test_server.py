import requests
import json
import psycopg2

con = psycopg2.connect(user="postgres", host="localhost", password="fabian1", dbname="chat")
con.cursor().execute(open("../import_db.sql", "r").read())
con.commit()
con.close()

url = "http://localhost:3000"

user0_name = "test0"
user1_name = "test1"
user2_name = "test2"

user0_password = "123456"
user1_password = "012345"
user2_password = "abc123"

group0_name = "group0"
group1_name = "group1"

group0_owner = user0_name
group1_owner = user1_name

group0_members = [ "test1", "test2" ]
group1_members = [ "test0", "test1", "test2" ]

def register_user(username, password):
    try:
        res = requests.post(url + "/register/" + username, headers={ "Content-Type": "application/json" }, data=json.dumps({ "password": password }))
        assert(res.status_code == 201)
    except:
        print(res.url)
        print(res.status_code)
        print(res.text)
        exit(-1)

def login_user(username, password):
    try:
        res = requests.post(url + "/login/" + username, headers={ "Content-Type": "application/json" }, data=json.dumps({ "password": password }))
        assert(res.status_code == 200)
        return json.loads(res.text)["token"]
    except:
        print(res.url)
        print(res.status_code)
        print(res.text)
        exit(-1)

def create_group(groupname, owner, token, members):
    try:
        res = requests.post(url + "/groups/" + groupname, headers={ "Content-Type": "application/json", "Authorization": json.dumps({ "name": owner, "token": token }) }, data=json.dumps({ "members": members }))
        assert(res.status_code == 201)
    except:
        print(res.url)
        print(res.status_code)
        print(res.text)
        exit(-1)

def getGroups(username, token):
    try:
        res = requests.get(url + "/groups", headers={ "Content-Type": "application/json", "Authorization": json.dumps({ "name": username, "token": token }) })
        assert(res.status_code == 200)
        return json.loads(res.text)["groups"]
    except:
        print(res.url)
        print(res.status_code)
        print(res.text)
        exit(-1)

def acceptGroupReq(username, token, groupid):
    try:
        res = requests.patch(url + "/groups/" + str(groupid) + "/accept", headers={ "Content-Type": "application/json", "Authorization": json.dumps({ "name": username, "token": token }) })
        assert(res.status_code == 200)
    except:
        print(res.url)
        print(res.status_code)
        print(res.text)
        exit(-1)

register_user(user0_name, user0_password)
register_user(user1_name, user1_password)
register_user(user2_name, user2_password)

user0_token = login_user(user0_name, user0_password)
user1_token = login_user(user1_name, user1_password)
user2_token = login_user(user2_name, user2_password)

create_group(group0_name, group0_owner, user0_token, group0_members)
create_group(group1_name, group1_owner, user1_token, group1_members)

user2_groups = getGroups(user2_name, user2_token)
user2_group0_id = user2_groups[0]["id"]

acceptGroupReq(user2_name, user2_token, user2_group0_id)
print(getGroups(user2_name, user2_token))
