function addFiles(files){
    for(var i=0;i<files.length;++i){
        addFile(files[i]);
    }
}

function addFile(file){
    var peer5Request = new peer5.Request({downloadeMode:"p2p"});
    peer5Request.onprogress = function(e){
//        updateShareProgressUI(e.loaded, e.total);
    }
    peer5Request.onload = function(e){
        userState = {isSeeder:true,origin:true};
        var fileInfo = {swarmId:this.getFileInfo().swarmId,filename:file.name,size:file.size};
        socket.emit('new file', fileInfo);
    }

    peer5Request.open('POST');
    peer5Request.onerror = function(e){
        switch (this.status) {
            case peer5.Request.FILE_SIZE_ERR:
//                fileSizeTooBigUI();
                break;
        }
    }
    peer5Request.send(file);
}

function getFile(fileInfo){
    showDownloadProgressUI(fileInfo);
    var peer5Request = new peer5.Request({downloadMode:"p2p"});
    peer5Request.onload = function(e){
        console.log("Finished downloading the file");
        saveFile(e.currentTarget.response,fileInfo.filename);
    }
    peer5Request.onloadstart = function(e){

    }
    peer5Request.onprogress = function(e){
        updateProgressUI(fileInfo.swarmId,e.loaded, e.total);
    }

    peer5Request.onswarmstatechange = function(e){

    }
    peer5Request.onerror = function(e){
        console.log("An error occured: " + this.status);
    }
    peer5Request.open("GET",fileInfo.swarmId);
    peer5Request.send();
}

function saveFile(blobUrl,name){
    var a = document.createElement('a');
    a.setAttribute('download', name);
    a.setAttribute('href', blobUrl);
    document.body.appendChild(a);
    a.click();
    if(getBrowserName()=='firefox')
        alert("thanks for downloading");
}

function getBrowserName() {
    var N = navigator.appName, ua = navigator.userAgent, tem;
    var M = ua.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);
    if (M && (tem = ua.match(/version\/([\.\d]+)/i)) != null) M[2] = tem[1];
    M = M ? [M[1], M[2]] : [N, navigator.appVersion, '-?'];
    return M[0].toLowerCase();
}