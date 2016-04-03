/**
 * Copyright 2015 Thierry BUGEAT
 * 
 * This file is part of myFeeds.
 * 
 * myFeeds is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * myFeeds is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with myFeeds.  If not, see <http://www.gnu.org/licenses/>.
 */

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

/**
 * v1.5+
 * */
MyFeeds.prototype._loadV15 = function(filename, callback) {
    _MyFeeds.log("MyFeeds.prototype._load()", arguments);
    
    return new Promise(function(resolve, reject) {
        if (typeof localStorage.getItem(filename) === 'string') { 
            var results = JSON.parse(localStorage.getItem(filename));
            _MyFeeds.log("MyFeeds.prototype._load() " + filename, results);
            resolve(results);
        } else {
            reject("{}");
        }
    });
}

/**
 * Load: Migration from v1.4 to 1.5+
 * */
MyFeeds.prototype._load = function(filename, callback) {
    _MyFeeds.log("MyFeeds.prototype._load()", arguments);
    
    return new Promise(function(resolve, reject) {
        if (typeof localStorage.getItem(filename) === 'string') { 
            var results = JSON.parse(localStorage.getItem(filename));
            _MyFeeds.log("MyFeeds.prototype._load() " + filename, results);
            resolve(results);
        } else {
            _MyFeeds._loadV14(filename, callback).then(function(_results) {
                resolve(_results);
            }).catch(function(error) {
                reject("{}");
            });
        }
    });
}

/**
 * v1.0 to v1.4
 * Load user data from SD card
 * */
MyFeeds.prototype._loadV14 = function(filename, callback) {
    _MyFeeds.log("MyFeeds.prototype._loadV14()", arguments);
    
    return new Promise(function(resolve, reject) {
        try {
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
        } catch (e) {
            if (typeof localStorage.getItem(filename) === 'string') { 
                var results = JSON.parse(localStorage.getItem(filename));
                _MyFeeds.log("MyFeeds.prototype._load() " + filename, results);
                resolve(results);
            } else {
                reject("");
            }
        }
    });
}

MyFeeds.prototype._loadJSON = function(filename) {   

    var xhr = new XMLHttpRequest();
        
    xhr.open('GET', filename, false);

    try {
        xhr.send();
    } catch (err) {
        xhr.send(null);
    }

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
        localStorage.setItem(filename, content);
        resolve("");
    });

}

/**
 * Share subscriptions as OPML file
 * @param {string} Export format "opml"
 * @param {boolean} _logsOnScreen Display or not logs on screen.
 *                                Overwrite settings.
 * */
 
 MyFeeds.prototype.export = function(format, _logsOnScreen) {
    
    var _output = ['<?xml version="1.0"?>',
        '<opml version="1.0">',
        '  <head>',
        '    <title>myFeeds</title>',
        '  </head>',
        '  <body>',
        '    <outline title="My feeds" type="folder">',
        ''
        ].join("\n");
    
    for (var _account in myFeedsSubscriptions) {

        var _feeds = gf.getFeeds();
        var _feed = "";
        var _outlines = "";
        var _nbOutlines = 0;
        
        for (var i = 0 ; i < _feeds.length; i++) {
            if ( _feeds[i].feed._myAccount == _account) {
                _nbOutlines++;
                _url = _feeds[i].feedUrl;
                _type = (_feeds[i].type.substr(0,3) == 'rss') ? 'rss' : 'atom';
                _outlines = _outlines + '        <outline type="' + _type + '" title="' + _feeds[i].title + '" text="' + _feeds[i].title + '" description="' + _feeds[i].description + '" xmlUrl="' + _url.htmlentities() + '" htmlUrl="' + _feeds[i].link + '" />' + "\n";
            }
        }
        
        if (_nbOutlines > 0){
            _output = _output + '      <outline type="folder" title="' + _account + '">' + "\n";
            _output = _output + _outlines;
            _output = _output + "      </outline>\n";
        }
    }
    
    _output = _output + "    </outline>\n  </body>\n</opml>\n";

    // Share by email : FxOS
    
    if (cordova.platformId === 'firefoxos') {
    
        var _blob = new Blob([_output], {type : 'text/x-opml+xml'});
    
        new MozActivity({
            name: "new",
            data: {
                type: ["mail"],
                number: 0,
                url: "mailto:?subject=[" + document.webL10n.get('app-title') + "] " + document.webL10n.get('my-subscriptions-opml') + "&body=" + document.webL10n.get('my-subscriptions-message'),
                body: "",
                filenames: ['myFeeds.subscriptions.opml'],
                blobs: [_blob]
            }
        });
        
    }
    
    // Cordova share via plugin    
    // https://www.npmjs.com/package/cordova-plugin-x-socialsharing
    
    else {
        window.plugins.socialsharing.shareViaEmail(
            document.webL10n.get('my-subscriptions-message'), // Message
            'myFeeds.subscriptions.opml', // Subject
            null, // TO: must be null or an array
            null, // CC: must be null or an array
            null, // BCC: must be null or an array
            'data:text/xml;base64,' + btoa(unescape(encodeURIComponent(_output))), //text/x-opml+xml
            function(){console.log('ok');}, // Called when email was sent or canceled, no way to differentiate
            function(){console.log('ko');}  // Called when something unexpected happened
        );
    }

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
    if (params.settings.developper_menu.logs.screen) {
        window.alert(message);
    }
}

/**
 * @param {string} message Message to display in console.
 * @param {string|array|object} arguments
 * */ 
MyFeeds.prototype.group = function (message, arguments) {
    if (params.settings.developper_menu.logs.console) {
        var _arguments = arguments || "";
        window.console && console.group(message, _arguments);
    }
}

/**
 * @param {string} message Message to display in console.
 * @param {string|array|object} arguments
 * */ 
MyFeeds.prototype.log = function (message, arguments) {
    if (params.settings.developper_menu.logs.console) {
        var _arguments = arguments || "";
        window.console && console.log(message, _arguments);
    }
}

/**
 * @param {string} message Warn message to display in console.
 * @param {string|array|object} arguments
 * */ 
MyFeeds.prototype.warn = function (message, arguments) {
    if (params.settings.developper_menu.logs.console) {
        var _arguments = arguments || "";
        window.console && console.warn(message, _arguments);
    }
}

/**
 * @param {string} message Error message to display in console.
 * @param {string|array|object} arguments
 * */ 
MyFeeds.prototype.error = function (message, arguments) {
    if (params.settings.developper_menu.logs.console) {
        var _arguments = arguments || "";
        window.console && console.error(message, _arguments);
    }
}

/**
 * Is it a small entry ?
 * @param {object} entry
 * @return {boolean} true, false
 * */
MyFeeds.prototype.isSmallEntry = function (entry) {
    var _out;

    if (entry.content == null) {
        entry.content = '';
    }

    if (entry.contentSnippet == null) {
        entry.contentSnippet = '';
    }

    var _diff = entry.content.length - entry.contentSnippet.length;
    
    if (_diff < params.entries.maxLengthForSmallEntries) {
        _out = true;
    } else {
        _out = false;
    }
    
    return _out;
}
