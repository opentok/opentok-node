function showNewFile(fileInfo){
    var div = document.getElementsByClassName("file_list")[0];
    var a = document.createElement('a');
    a.innerHTML = fileInfo.filename;
    a.href = "javascript:void(0)";
    a.onclick = function(){
        getFile(fileInfo)
    };
    div.appendChild(a)
}