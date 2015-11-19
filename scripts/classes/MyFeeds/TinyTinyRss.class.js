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

/* =========================== */
/* --- Tiny Tiny Rss Class --- */
/* =========================== */

var TinyTinyRss = function() {
    
    MyFeeds.call(this); /* Call the constructor of parent class. */

    this.tinytinyrss = {
        //"host"          : "",
        "url"           : "",
        "method"        : "POST",
        "output"        : "json",
        "accountType"   : "HOSTED_OR_GOOGLE",
        "client"        : "myFeeds",
        "user"          : "",
        "password"      : "",
        "token"         : {}, // session_id
        "subscriptions" : []
    };

    _TinyTinyRss = this;
}
TinyTinyRss.prototype = new MyFeeds();

/* =============== */
/* --- Methods --- */
/* =============== */

TinyTinyRss.prototype.setToken = function(token) {
    _MyFeeds.log('TinyTinyRss.prototype.setToken()', arguments);
    if (typeof token['content']['session_id'] !== 'undefined') {
        this.tinytinyrss.token = token;
        return 1;
    } else {
        document.body.dispatchEvent(new CustomEvent('TinyTinyRss.setToken.error', {"detail": token}));
        window.alert("Tiny Tiny Rss Error : \n" + JSON.stringify(token));
        return 0;
    }
}

TinyTinyRss.prototype.getToken = function() {
    _MyFeeds.log('TinyTinyRss.prototype.getToken()');
    return this.tinytinyrss.token;
}

/**
 * updateToken()
 * Use "refresh_token" to obtain a new "access_token"
 * @todo Not yet implemented
 * @param   {null}
 * @return  {CustomEvent} TinyTinyRss.getNewToken.done | TinyTinyRss.getNewToken.error
 * */

TinyTinyRss.prototype.updateToken = function() {
    _MyFeeds.log('TinyTinyRss.prototype.getNewToken()');
    
    return new Promise(function(resolve, reject) {
        resolve('{}');
    });
}

/**
 * login(url, user, password)
 *
 * @param   {string} url
 * @param   {string} user
 * @param   {string} password
 * @return  {CustomEvent} TinyTinyRss.login.done | TinyTinyRss.login.error
 * */

TinyTinyRss.prototype.login = function(url, user, password) {
    _MyFeeds.log('TinyTinyRss.prototype.login()', arguments);
    
    _TinyTinyRss.tinytinyrss.url = url;
    _TinyTinyRss.tinytinyrss.user = user;
    _TinyTinyRss.tinytinyrss.password = password;
    
    var _url = _TinyTinyRss.tinytinyrss.url + '/api/';
    
    var _params = JSON.stringify({op: 'login', user: _TinyTinyRss.tinytinyrss.user, password: _TinyTinyRss.tinytinyrss.password });

    this.post(_url, _params).then(function(response) {
        if (_TinyTinyRss.setToken(response)) {
            response.lastModified = Math.floor(new Date().getTime() / 1000);
            _TinyTinyRss._save('cache/tinytinyrss/access_token.json', 'application/json', JSON.stringify(response));
            document.body.dispatchEvent(new CustomEvent('TinyTinyRss.login.done', {"detail": response}));
            _MyFeeds.log('CustomEvent : TinyTinyRss.login.done');
        } else {
            document.body.dispatchEvent(new CustomEvent('TinyTinyRss.login.error', {"detail": response}));
            _MyFeeds.log('CustomEvent : TinyTinyRss.login.error');
        }
    }).catch(function(error) {
        reject(Error(JSON.stringify(error)));
    });

};

/**
 * getSubscriptions()
 *
 * @param   {null}
 * @return  {CustomEvent} TinyTinyRss.getSubscriptions.done | TinyTinyRss.getSubscriptions.error
 * */

TinyTinyRss.prototype.getSubscriptions = function () {
    _MyFeeds.log('TinyTinyRss.prototype.getSubscriptions()');
    
    var _url = _TinyTinyRss.tinytinyrss.url + '/api/';
    
    var _params = JSON.stringify({"op": 'getFeeds', "sid": _TinyTinyRss.getToken().content.session_id, "user": _TinyTinyRss.tinytinyrss.user, "password": _TinyTinyRss.tinytinyrss.password});

    this.post(_url, _params).then(function(response) {
        _TinyTinyRss.tinytinyrss.subscriptions = response;
        document.body.dispatchEvent(new CustomEvent('TinyTinyRss.getSubscriptions.done', {"detail": response}));
        _MyFeeds.log("CustomEvent : TinyTinyRss.getSubscriptions.done");
    }).catch(function(error) {
        document.body.dispatchEvent(new CustomEvent('TinyTinyRss.getSubscriptions.error', {"detail": error}));
        _MyFeeds.error("CustomEvent : TinyTinyRss.getSubscriptions.error", error);
    });
}

/**
 * deleteSubscription(feedId)
 *
 * @param   {feedId} String Feed id
 * @return  {CustomEvent} TinyTinyRss.deleteSubscription.done | TinyTinyRss.deleteSubscription.error
 * */

TinyTinyRss.prototype.deleteSubscription = function (feedId) {
    _MyFeeds.log('TinyTinyRss.prototype.deleteSubscription()', arguments);
    
    return new Promise(function(resolve, reject) {
        
        var _url = _TinyTinyRss.tinytinyrss.host + '/reader/api/0/subscription/edit';
            
        var _params = 'output=json' + 
            '&ac=unsubscribe' + 
            '&s=' + encodeURIComponent(feedId);
        
        /*if (params.settings.proxy.use) {
            _urlParams = '&method=post&myAuth=' + _TinyTinyRss.tinytinyrss.token.Auth + '&url=' + encodeURIComponent(_TinyTinyRss.tinytinyrss.host + '/reader/api/0/subscription/edit' + '?output=' + encodeURIComponent(_TinyTinyRss.tinytinyrss.output) + '&ac=unsubscribe&s=' + encodeURIComponent(feedId));
            _url = 'http://' + params.settings.proxy.host + '/proxy/tinytinyrss/?' + _urlParams;
        }*/       
        
        _TinyTinyRss._delete(_url, _params).then(function(response) {
            resolve(response);
        }).catch(function(error) {
            reject(Error(JSON.stringify(error)));
        });
    
    });
}

/**
 * get(_url, myParams)
 * 
 * @param {_url} string Url to load.
 * @param {myParams} object You can retrieve this object in response.
 * 
 * */
 
TinyTinyRss.prototype.get = function (_url, myParams) {
    _MyFeeds.log('TinyTinyRss.prototype.get()', arguments);
    
    return new Promise(function(resolve, reject) {
        
        var xhr = new XMLHttpRequest({ mozSystem: true });
        
        xhr.open('GET', _url, true);
        
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

        if (_TinyTinyRss.tinytinyrss.token) {
            xhr.setRequestHeader("Authorization", "GoogleLogin auth=" + _TinyTinyRss.tinytinyrss.token.Auth);
        }

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

/**
 * post(url, params, callback)
 * 
 * @param {string} url Url to load.
 * @param {string} params Url parameters.
 * @param {string} callback.
 * 
 * */
TinyTinyRss.prototype.postV1 = function (_url, _params, callback) {
    _MyFeeds.log('TinyTinyRss.prototype.post()', arguments);
    
    return new Promise(function(resolve, reject) {

        var xhr = new XMLHttpRequest({ mozSystem: true });

        xhr.open('POST', _url, true);

        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
     
        if (_TinyTinyRss.tinytinyrss.token) {
            xhr.setRequestHeader("Authorization", "GoogleLogin auth=" + _TinyTinyRss.tinytinyrss.token.Auth);
        }

        xhr.onload = function() {
            var _response;

            try {
                _response = JSON.parse(xhr.response);
            } catch (e) {
                _response = xhr.response;
            }
            typeof callback === 'function' && callback(_response);
        };

        xhr.onerror = function(e) {
            typeof callback === 'function' && callback(Error(e));
        };
        
        xhr.send(_params);
    });
}

TinyTinyRss.prototype.post = function (_url, _params) {
    _MyFeeds.log('TinyTinyRss.prototype.post()', arguments);
    
    return new Promise(function(resolve, reject) {

        var xhr = new XMLHttpRequest({ mozSystem: true });

        xhr.open('POST', _url, true);

        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
     
        if (_TinyTinyRss.tinytinyrss.token) {
            xhr.setRequestHeader("Authorization", "GoogleLogin auth=" + _TinyTinyRss.tinytinyrss.token.Auth);
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
            var _response = {"responseData": {"_myParams": myParams}};
            reject(Error(_response));
        };
        
        xhr.send(_params);
    });
}

TinyTinyRss.prototype._delete = function (url, params) {
    _MyFeeds.log('TinyTinyRss.prototype._delete()', arguments);
    
    return new Promise(function(resolve, reject) {

        var xhr = new XMLHttpRequest({ mozSystem: true });

        xhr.open('POST', url, true);

        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        
        if (_TinyTinyRss.tinytinyrss.token) {
            xhr.setRequestHeader("Authorization", "GoogleLogin auth=" + _TinyTinyRss.tinytinyrss.token.Auth);
        }

        xhr.onload = function() {
            
            if (xhr.status == 200) {

                var _response = xhr.response;

                try {
                    resolve(_response);
                } catch(err) {
                    reject(Error(JSON.stringify(err)));
                }
                
            } else {
                reject(Error(xhr.statusText));
            }
        };

        xhr.onerror = function(error) {
            reject(Error(JSON.stringify(error)));
        };
        
        xhr.send(params);
    });
}
