module.exports = function(server){
    var io = require('socket.io')(server);
    io.on('connection', function (socket) {
        socket.emit('hello', {});
        socket.on('new file', function (data) {
            var roomId = socket.rooms[1];
            if(rooms[roomId].files)
                rooms[roomId].files.push(data);
            else
                rooms[roomId].files = [data];
            console.log(data);
            io.sockets.in(socket.rooms[1]).emit("new file",data);
        });
        socket.on('room', function(room) {
            socket.join(room.id);
            if(rooms[room.id].files){
                for(var i=0;i<rooms[room.id].files.length;++i){
                    socket.emit("new file",rooms[room.id].files[i]);
                }
            }
        });
    });
}
