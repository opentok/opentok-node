function showNewFile(fileInfo){
    var div = document.getElementsByClassName("file_list")[0];
    var emptyDiv = document.createElement('div');
    emptyDiv.className = fileInfo.swarmId;
    var a = document.createElement('a');
    a.innerHTML = fileInfo.filename;
    a.href = "javascript:void(0)";
    a.onclick = function(){
        getFile(fileInfo)
    };
    emptyDiv.appendChild(a);
    div.appendChild(emptyDiv);
}

showDownloadProgressUI = function(fileInfo){
    var div = document.getElementsByClassName(fileInfo.swarmId)[0];
    var progressBar = document.createElement('progress');
    progressBar.className = 'progress_'+fileInfo.swarmId;
    progressBar.value = 0;
    progressBar.max = 100;
    div.appendChild(progressBar);
    var span = document.createElement('span');
    span.innerHTML = " " + fileInfo.size + "bytes";
    div.appendChild(span);
}

updateProgressUI = function(swarmId,loaded,total){
    var progress = document.getElementsByClassName('progress_'+ swarmId)[0];
    progress.value = 100*loaded/total;
}
