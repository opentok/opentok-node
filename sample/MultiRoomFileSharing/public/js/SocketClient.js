var socket = io.connect(window.location.host);
socket.on('hello', function (data) {
    socket.emit('room', {id:window.location.pathname.split("/")[1]});
});
socket.on('new file',function(fileInfo){
    showNewFile(fileInfo);
})