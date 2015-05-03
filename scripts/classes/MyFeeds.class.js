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
        console.warn("Unable to get the file: ", this.error);
    }

}
