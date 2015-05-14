/* =============== */
/* --- MyFeeds --- */
/* =============== */

var MyFeeds = function() {
    _MyFeeds = this;
}

/* =============== */
/* --- Methods --- */
/* =============== */

MyFeeds.prototype.base64_encode = function(str) { return btoa(str); }
MyFeeds.prototype.base64_decode = function(str) { return atob(str); }

MyFeeds.prototype._load = function(filename, callback) {
    var sdcard      = navigator.getDeviceStorage('sdcard');
    var request     = sdcard.get('myFeeds/' + filename);
    var dataType    = filename.split('.').pop();            // ".json"
    var results     = "";

    request.onsuccess = function () {
        var file = this.result;
        console.log("Get the file: ", file);
        var _fr = new FileReader();
        
        _fr.onloadend = function(event) {
            if (event.target.readyState == FileReader.DONE) {
                if (dataType == "json") {
                    results = JSON.parse(event.target.result);
                    console.log(JSON.parse(event.target.result));
                } else {
                    results = event.target.result;
                    console.log(event.target.result);
                }
                callback(results);
            }
        };
        
        _fr.readAsText(file);
    }

    request.onerror = function () {
        console.warn("Unable to get the file: " + filename, this.error);
    }

}

/**
 * @param {string} filename
 * @param {string} mimetype "text/plain" "application/json"
 * @param {string} content
 * */
MyFeeds.prototype._save = function(filename, mimetype, content) {

    var sdcard = navigator.getDeviceStorage("sdcard");
    var file   = new Blob([content], {type: mimetype});
    
    // Delete previous file
    
    var request = sdcard.delete("myFeeds/" + filename);

    request.onsuccess = function () {
        console.log("File deleted");
    }

    request.onerror = function () {
        console.log("Unable to delete the file: ", this.error);
    }

    // Save new file

    var request = sdcard.addNamed(file, "myFeeds/" + filename);
    //var request = myStorage.add(file);

    request.onsuccess = function () {
        console.log('File "' + this.result);
        
    }

    // An error typically occur if a file with the same name already exist
    request.onerror = function () {
        console.warn("Unable to write the file: ", this.error);
    }
}

MyFeeds.prototype._file_exists = function(filename, callback) {
    console.log('MyFeeds.prototype._file_exist', arguments);
    
    var sdcard  = navigator.getDeviceStorage("sdcard");
    var request = sdcard.get('myFeeds/' + filename);

    request.onsuccess = function () {
        console.log('_file_exist() = 1 "', this.result);
        callback(1);
    }

    request.onerror = function () {
        console.warn("_file_exist() = 0 ", this.error);
        callback(0);
    }
}
