(function(){
    var button = document.getElementById('create_room_btn');

    button.addEventListener('click',function(e){
        var roomName = document.getElementById('room_name').value;
        history.pushState({}, roomName, roomName);
//        window.location.href = roomName;
        location.reload();
    })
})();

