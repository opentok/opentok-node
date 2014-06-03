var socket = io.connect('http://localhost:3000');
socket.on('hello', function (data) {
    socket.emit('room', {id:window.location.pathname.split("/")[1]});
});
socket.on('new file',function(fileInfo){
    showNewFile(fileInfo);
})