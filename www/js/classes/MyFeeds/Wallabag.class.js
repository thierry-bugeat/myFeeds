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

/* ====================== */
/* --- Wallabag Class --- */
/* ====================== */

var Wallabag = function() {
    
    //MyFeeds.call(this); /* Appel du constructeur de la classe parente */

    this.wallabag = {
        "host_auth"     : "",
        "host"          : "",
        "client_id"     : "",
        "client_secret" : "",
        "method"        : "GET",
        "code"          : "",
        "token"         : {},
        "environment"   : "dev", // dev, prod
        "environments"  : {
            "dev" : 
            {
                "host_auth"     : "http://v2.wallabag.org",
                "host"          : "http://v2.wallabag.org",
                "client_id"     : "1_3bcbxd9e24g0gk4swg0kwgcwg4o8k8g4g888kwc44gcc0gwwk4",
                "client_secret" : "4ok2x70rlfokc8g0wws8c8kwcokw80k44sg48goc0ok4w0so0k",
                "username"      : "nicosomb",   // or wallabag
                "password"      : "nicolas"     // or wallabag
            },
            "prod" : 
            {
                "host_auth"     : "http://127.0.0.1:8000",
                "host"          : "http://127.0.0.1:8000",
                "client_id"     : "",
                "client_secret" : "",
                "username"      : "",
                "password"      : ""
            }
        }
    };
    
    this.wallabag.host_auth     = this.wallabag.environments[this.wallabag.environment].host_auth;
    this.wallabag.host          = this.wallabag.environments[this.wallabag.environment].host;
    this.wallabag.client_id     = this.wallabag.environments[this.wallabag.environment].client_id;
    this.wallabag.client_secret = this.wallabag.environments[this.wallabag.environment].client_secret;

    this.myFeedsSubscriptions = [];
    this.nbFeedsToLoad = 0;
    
    _Wallabag = this;
}
Wallabag.prototype = new MyFeeds();

/* =============== */
/* --- Methods --- */
/* =============== */

Wallabag.prototype.setFeedsSubscriptions = function(myFeedsSubscriptions) { 
    _MyFeeds.log('Wallabag.prototype.setFeedsSubscriptions()', myFeedsSubscriptions);
    
    var _tmp = [];
    
    for (var _account in myFeedsSubscriptions) {
        for (var i = 0 ; i < myFeedsSubscriptions[_account]['subscriptions'].length ; i++) {
            myFeedsSubscriptions[_account]['subscriptions'][i].account = _account;
            _tmp.push(myFeedsSubscriptions[_account]['subscriptions'][i]);
        }
    }
    
    this.myFeedsSubscriptions = _tmp;
    this.nbFeedsToLoad = this.myFeedsSubscriptions.length;
}

Wallabag.prototype._saveParams = function() {
    _MyFeeds._save("cache/wallabag/params.json", "application/json", _Wallabag.getParams()).then(function(results) {
        _MyFeeds.log("Save file cache/wallabag/params.json");
    }).catch(function(error) {
        _MyFeeds.error("ERROR saving file cache/wallabag/params.json", error);
        _MyFeeds.alert("ERROR saving file cache/wallabag/params.json");
    });
}

Wallabag.prototype.getParams = function() {
    return '{"url": "' + _Wallabag.wallabag.url + '", "user": "' + _Wallabag.wallabag.user + '"}';
}

Wallabag.prototype.setToken = function(token) {
    _MyFeeds.log('Wallabag.prototype.setToken()', arguments);
    if (typeof token['access_token'] !== 'undefined') {
        this.wallabag.token = token;
        return 1;
    } else {
        document.body.dispatchEvent(new CustomEvent('Wallabag.setToken.error', {"detail": token}));
        window.alert("Wallabag Error : \n" + JSON.stringify(token));
        return 0;
    }
}

Wallabag.prototype.getToken = function() {
    _MyFeeds.log('Wallabag.prototype.getToken()');
    return this.wallabag.token;
}

/**
 * updateToken()
 * Use "refresh_token" to obtain a new "access_token"
 * @todo Not yet implemented
 * @param   {null}
 * @return  {CustomEvent} Wallabag.getNewToken.done | Wallabag.getNewToken.error
 * */

Wallabag.prototype.updateToken = function() {
    _MyFeeds.log('Wallabag.prototype.getNewToken()');
    
    return new Promise(function(resolve, reject) {
        resolve('{}');
    });
}

/*Wallabag.prototype.updateToken = function() {
    _MyFeeds.log('Wallabag.prototype.updateToken()');
    
    return new Promise(function(resolve, reject) {
        
        var _url = _Wallabag.wallabag.url + '/oauth/v2/token';

        var _params = 'refresh_token=' + encodeURIComponent(_Wallabag.wallabag.token.refresh_token) + 
            '&client_id=' + encodeURIComponent(_Wallabag.wallabag.client_id) +
            '&client_secret=' + encodeURIComponent(_Wallabag.wallabag.client_secret) +
            '&grant_type=refresh_token';

        var promise = _Wallabag.post(_url, _params).then(function(response) {
            if (typeof response['errorMessage'] !== 'undefined') {
                window.alert("Wallabag Error : \n" + JSON.stringify(response));
                _MyFeeds.log('CustomEvent : Wallabag.getNewToken.error');
            } else {
                _Wallabag.wallabag.token.access_token = response.access_token;
                _Wallabag.wallabag.token.lastModified = Math.floor(new Date().getTime() / 1000);
                _Wallabag._save('cache/wallabag/access_token.json', 'application/json', JSON.stringify(_Wallabag.wallabag.token));
                _Wallabag._save('cache/wallabag/access_token.new.json', 'application/json', JSON.stringify(response));
                document.body.dispatchEvent(new CustomEvent('Wallabag.getNewToken.done', {"detail": response}));
                _MyFeeds.log('CustomEvent : Wallabag.getNewToken.done');
            }
        }).catch(function(error) {
            document.body.dispatchEvent(new CustomEvent('Wallabag.getNewToken.error', {"detail": error}));
            _MyFeeds.error("CustomEvent : Wallabag.getNewToken.error", error);
            reject(Error(JSON.stringify(error)));
        });
    
    });
}*/

Wallabag.prototype.getSubscriptions = function() {
    _MyFeeds.log('Wallabag.prototype.getSubscriptions()');

    var _response = {"content": [
        {"account": "wallabag", "id": "unread", "url": _Wallabag.wallabag.url + "/api/entries.json?", "title": "Unread"},
        {"account": "wallabag", "id": "starred", "url": _Wallabag.wallabag.url + "/api/entries.json?star=true", "title": "Starred"},
        {"account": "wallabag", "id": "archive", "url": _Wallabag.wallabag.url + "/api/entries.json?archive=true", "title": "Archive"}
    ]};
    
    document.body.dispatchEvent(new CustomEvent('Wallabag.getSubscriptions.done', {"detail": _response}));
}

Wallabag.prototype.getEntries = function() {
    _MyFeeds.log('Wallabag.prototype.getEntries()');

    var _url = _Wallabag.wallabag.url + '/api/entries.json?page=1&perPage=50';

    var promise = this.get(_url, '').then(function(response) {
        _MyFeeds.log(response);
        document.body.dispatchEvent(new CustomEvent('Wallabag.getEntries.done', {"detail": response}));
        _MyFeeds.log("CustomEvent : Wallabag.getEntries.done");
    }, function(error) {
        document.body.dispatchEvent(new CustomEvent('Wallabag.getEntries.error', {"detail": error}));
        _MyFeeds.error("CustomEvent : Wallabag.getEntries.error", error);
    });

}

/**
 * login(url, user, password)
 *
 * @param   {string} url
 * @param   {string} user
 * @param   {string} password
 * @return  {CustomEvent} Wallabag.login.done | Wallabag.login.error
 * */

Wallabag.prototype.login = function(url, user, password) {
    _MyFeeds.log('Wallabag.prototype.login()', arguments);
    
    _Wallabag.wallabag.url = url;
    _Wallabag.wallabag.user = user;
    _Wallabag.wallabag.password = password;
    
    var _url = _Wallabag.wallabag.url + '/oauth/v2/token';
    
    var _params = 'client_id=' + encodeURIComponent(_Wallabag.wallabag.client_id) + 
        '&client_secret=' + encodeURIComponent(_Wallabag.wallabag.client_secret) + 
        '&grant_type=password' + 
        '&username=' + user +
        '&password=' + password;

    this.post(_url, _params).then(function(response) {
        if (_Wallabag.setToken(response)) {
            _Wallabag._saveParams(); // Save user name & server URL
            response.lastModified = Math.floor(new Date().getTime() / 1000);
            _Wallabag._save('cache/wallabag/access_token.json', 'application/json', JSON.stringify(response));
            document.body.dispatchEvent(new CustomEvent('Wallabag.login.done', {"detail": response}));
            _MyFeeds.log('CustomEvent : Wallabag.login.done');
        } else {
            document.body.dispatchEvent(new CustomEvent('Wallabag.login.error', {"detail": response}));
            _MyFeeds.log('CustomEvent : Wallabag.login.error');
        }
    }).catch(function(error) {
        my.alert(JSON.stringify(error));
    });

};

/**
 * Load all feeds
 * @param {int} nbDaysToLoad Limit loading to N days.
 * */
Wallabag.prototype.loadFeeds = function(nbDaysToLoad) {
    
    _MyFeeds.log('Wallabag.prototype.loadFeeds()', this.myFeedsSubscriptions);

    this.nbFeedsLoaded = 0;
    this.unsortedFeeds = [];
    
    if (this.myFeedsSubscriptions.length > 0) {
        for (var i = 0; i < this.myFeedsSubscriptions.length; i++) {

            var _myFeed     = this.myFeedsSubscriptions[i];
            var _urlParams  = '&page=1&perPage=50';
            var _url        = _myFeed.url + _urlParams;
            var _myParams   = {"nbFeeds": this.myFeedsSubscriptions.length, "account": _myFeed.account, "url": _myFeed.url, "id": _myFeed.id, "pulsations": 4};
            
            var promise = this.get(_url, _myParams).then(function(response) {
                //response.feed._myAccount = response.responseData._params.account; // Add _myAccount value
                //response.feed._myFeedId = response.responseData._params.id; // Add __id value
                _MyFeeds.log("Wallabag.prototype.loadFeeds() > get > response : ", response);
                document.body.dispatchEvent(new CustomEvent('Wallabag.load.done', {"detail": response}));
            }).catch(function(error) {
                // Network error then try to load feed from cache
                console.log(error);
                try {
                    var _message = JSON.parse(error.message);
                } catch (e) {
                    window.alert("Wallabag error loading from cache:\n" + e.message + ' / ' + JSON.stringify(error));
                    error._myParams = _myParams;
                    error._myFeedUrl = _myFeed.url;
                    document.body.dispatchEvent(new CustomEvent('Wallabag.load.error', {"detail": error}));
                }
                
                my._load('cache/wallabag/feeds/' + btoa(_message.responseData._myParams.url) + ".json").then(function(_cacheContent){
                    _message.responseData.feed = _cacheContent;
                    document.body.dispatchEvent(new CustomEvent('Wallabag.load.done', {"detail": _message}));
                }).catch(function(error) {
                    // @todo
                    error._myParams = _myParams;
                    error._myFeedUrl = _myFeed.url;
                    document.body.dispatchEvent(new CustomEvent('Wallabag.load.error', {"detail": error}));
                });
                // ---
            });
        }
    }

}

/**
 * get(url, myParams)
 * 
 * @param string url Url to load.
 * @param object myParams You can retrieve this object in response.
 * 
 * */
 
Wallabag.prototype.get = function (url, myParams) {
    _MyFeeds.log('Wallabag.prototype.get()', arguments);
    
    return new Promise(function(resolve, reject) {
        
        var xhr = new XMLHttpRequest({ mozSystem: true });
        
        xhr.open('GET', url);
        
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

        xhr.setRequestHeader("Authorization", "Bearer " + _Wallabag.wallabag.token.access_token);
        
        xhr.onload = function() {
            if (xhr.status == 200) {

                var _response = JSON.parse(xhr.response);

                try {
                    resolve(_response);
                } catch(err) {
                    reject(Error(err));
                }
                
            } else {
                reject(Error(xhr.statusText));
            }
        };

        xhr.onerror = function() {
            var _response = {"responseData": {"_myParams": myParams}};
            reject(Error(_response));
        };
        
        xhr.send();
    });
}

Wallabag.prototype.post = function (_url, _params) {
    _MyFeeds.log('Wallabag.prototype.post()', arguments);
    
    return new Promise(function(resolve, reject) {

        var xhr = new XMLHttpRequest({ mozSystem: true });

        xhr.open('POST', _url, true);

        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
     
        if (_Wallabag.wallabag.token) {
            xhr.setRequestHeader("Authorization", "Bearer " + _Wallabag.wallabag.token.access_token);
        }

        xhr.onload = function() {
            
            if (xhr.status == 200) {

                var _response;

                try {
                    _response = JSON.parse(xhr.response);
                } catch (e) {
                    _response = xhr.response;
                }
                resolve(_response);
            
            } else {
                reject(Error(xhr.statusText));
            }

        };

        xhr.onerror = function() {
            var _response = {"responseData": {"_myParams": _params}};
            reject(Error(_response));
        };
        
        xhr.send(_params);
    });
}

