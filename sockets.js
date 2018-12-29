const socket_io = require("socket.io");
const authenticate = require("./authentication").authenticate;

function initSockets(server) {
    const io = socket_io(server);
    let authArr = [ ];
    
    io.on("connection", (socket) => {
        authArr[socket.id] = false;
        socket.on("disconnect", () => {
            delete authArr[socket.id];
        });
        socket.on("authenticate", (name, token, callback) => {
            authenticate(name, token, () => { 
                callback(true);
                authArr[socket.id] = true;
            }, 
                () => callback(false));
        });
        socket.on("getStatus", (data, callback) => {
            callback(authArr[socket.id] ? "authenticated" : "not authenticated");
        });
    });
    return io;
}

module.exports = initSockets;