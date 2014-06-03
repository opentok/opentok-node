module.exports = function(server){
    var io = require('socket.io')(server);
    io.on('connection', function (socket) {
        socket.emit('hello', {});
        socket.on('new file', function (data) {
            console.log(data);
            io.sockets.in(socket.rooms[1]).emit("new file",data);
        });
        socket.on('room', function(room) {
            socket.join(room.id);
        });
    });
}
