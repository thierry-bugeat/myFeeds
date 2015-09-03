/* =============== */
/* --- MyFeeds --- */
/* =============== */

var MyFeeds = function() {
    _MyFeeds = this;
}

/* =============== */
/* --- Methods --- */
/* =============== */

MyFeeds.params;

MyFeeds.prototype.base64_encode = function(str) { return btoa(str); }
MyFeeds.prototype.base64_decode = function(str) { return atob(str); }

MyFeeds.prototype._load = function(filename, callback) {
    _MyFeeds.log("MyFeeds.prototype._load()", arguments);
    
    return new Promise(function(resolve, reject) {
        var sdcard      = navigator.getDeviceStorage('sdcard');
        var request     = sdcard.get('myFeeds/' + filename);
        var dataType    = filename.split('.').pop();            // ".json"
        var results     = "";

        request.onsuccess = function () {
            var file = this.result;
            _MyFeeds.log("MyFeeds.prototype._load()", file);
            var _fr = new FileReader();
            
            _fr.onloadend = function(event) {
                if (event.target.readyState == FileReader.DONE) {
                    if (dataType == "json") {
                        results = JSON.parse(event.target.result);
                        _MyFeeds.log(JSON.parse(event.target.result));
                    } else {
                        results = event.target.result;
                        _MyFeeds.log(event.target.result);
                    }
                    //callback(results);
                    _MyFeeds.log("MyFeeds.prototype._load() " + filename, results);
                    resolve(results);
                }
            };
            
            _fr.readAsText(file);
        }

        request.onerror = function () {
            _MyFeeds.warn("Unable to get file: " + filename, this.error);
            reject(Error());
        }
    });
}

MyFeeds.prototype._loadJSON = function(filename) {   

    var xhr = new XMLHttpRequest();
        
    xhr.open('GET', filename, false);
    xhr.send(null);

    if (xhr.status === 200) {
        try {
            return (JSON.parse(xhr.response));
        } catch(err) {
             return "{}";
        }
    }
}

/**
 * @param {string} filename
 * @param {string} mimetype "text/plain" "application/json"
 * @param {string} content
 * */
MyFeeds.prototype._save = function(filename, mimetype, content) {

    return new Promise(function(resolve, reject) {
        
        var sdcard = navigator.getDeviceStorage("sdcard");
        var file   = new Blob([content], {type: mimetype});

        // Delete previous file
        
        var request = sdcard.delete("myFeeds/" + filename);
        request.onsuccess = function() {
            _MyFeeds.log("File deleted");
            
            // Save new file
        
            var request = sdcard.addNamed(file, "myFeeds/" + filename);

            request.onsuccess = function () {
                resolve(this.result);
            }

            request.onerror = function (error) {
                var _myError = {
                    "filename": filename,
                    "message": "Unable to write the file",
                    "error": error
                };
                reject(Error(JSON.stringify(_myError)));
            }
            
        };
        request.onerror = function() { reject(Error(JSON.stringify(error))); };
    });

}

MyFeeds.prototype._file_exists = function(filename, callback) {
    _MyFeeds.log('MyFeeds.prototype._file_exist', arguments);
    
    var sdcard  = navigator.getDeviceStorage("sdcard");
    var request = sdcard.get('myFeeds/' + filename);

    request.onsuccess = function () {
        _MyFeeds.log('_file_exist() = 1 "', this.result);
        callback(1);
    }

    request.onerror = function () {
        _MyFeeds.warn("_file_exist() = 0 ", this.error);
        callback(0);
    }
}

MyFeeds.prototype._file_exists_v2 = function(filename, callback) {
    _MyFeeds.log('MyFeeds.prototype._file_exist', arguments);

    return new Promise(function(resolve, reject) {
        var sdcard  = navigator.getDeviceStorage("sdcard");
        var request = sdcard.get('myFeeds/' + filename);
    
        request.onsuccess = function () {
            _MyFeeds.log('_file_exist() = 1 "', this.result);
            //callback(1);
            resolve();
        }

        request.onerror = function () {
            _MyFeeds.warn("_file_exist() = 0 ", this.error);
            //callback(0);
            reject(Error(0));
        }
        
    });
}

/**
 * @param {string} message Message to display on screen for user.
 * */ 
MyFeeds.prototype.message = function (message) {
    window.alert(message);
}

/**
 * @param {string} message Message to display on screen for developper.
 * */ 
MyFeeds.prototype.alert = function (message) {
    if (MyFeeds.params.settings.developper_menu.logs.screen) {
        window.alert(message);
    }
}

/**
 * @param {string} message Message to display in console.
 * @param {string|array|object} arguments
 * */ 
MyFeeds.prototype.group = function (message, arguments) {
    if (MyFeeds.params.settings.developper_menu.logs.console) {
        var _arguments = arguments || "";
        console.group(message, _arguments);
    }
}

/**
 * @param {string} message Message to display in console.
 * @param {string|array|object} arguments
 * */ 
MyFeeds.prototype.log = function (message, arguments) {
    if (MyFeeds.params.settings.developper_menu.logs.console) {
        var _arguments = arguments || "";
        console.log(message, _arguments);
    }
}

/**
 * @param {string} message Warn message to display in console.
 * @param {string|array|object} arguments
 * */ 
MyFeeds.prototype.warn = function (message, arguments) {
    if (MyFeeds.params.settings.developper_menu.logs.console) {
        var _arguments = arguments || "";
        console.warn(message, _arguments);
    }
}

/**
 * @param {string} message Error message to display in console.
 * @param {string|array|object} arguments
 * */ 
MyFeeds.prototype.error = function (message, arguments) {
    if (MyFeeds.params.settings.developper_menu.logs.console) {
        var _arguments = arguments || "";
        console.error(message, _arguments);
    }
}
