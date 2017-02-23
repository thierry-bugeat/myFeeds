/**
 * Copyright 2015, 2016, 2017 Thierry BUGEAT
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

/* ============================ */
/* --- The Old Reader Class --- */
/* ============================ */

var TheOldReader = function() {
    
    //MyFeeds.call(this); /* Call the constructor of parent class. */

    this.theoldreader = {
        "host"          : "https://theoldreader.com",
        "method"        : "POST",
        "output"        : "json",
        "accountType"   : "HOSTED_OR_GOOGLE",
        "client"        : "myFeeds",
        "email"         : "",
        "password"      : "",
        "token"         : {},
        "subscriptions" : []
    };

    _TheOldReader = this;
}
TheOldReader.prototype = new MyFeeds();

/* =============== */
/* --- Methods --- */
/* =============== */

TheOldReader.prototype._saveParams = function() {
    _MyFeeds._save("cache/theoldreader/params.json", "application/json", _TheOldReader.getParams()).then(function(results) {
        _MyFeeds.log("Save file cache/theoldreader/params.json");
    }).catch(function(error) {
        _MyFeeds.error("ERROR saving file cache/theoldreader/params.json", error);
        _MyFeeds.alert("ERROR saving file cache/theoldreader/params.json");
    });
}

TheOldReader.prototype.getParams = function() {
    return '{"url": "' + _TheOldReader.theoldreader.url + '", "email": "' + _TheOldReader.theoldreader.email + '", "password": "' + _TheOldReader.theoldreader.password + '"}';
}

TheOldReader.prototype.setToken = function(token) {
    _MyFeeds.log('TheOldReader.prototype.setToken()', arguments);
    if (typeof token['Auth'] !== 'undefined') {
        this.theoldreader.token = token;
        return 1;
    } else {
        document.body.dispatchEvent(new CustomEvent('TheOldReader.setToken.error', {"detail": token}));
        window.alert("The Old Reader Error : \n" + JSON.stringify(token));
        return 0;
    }
}

TheOldReader.prototype.getToken = function() {
    _MyFeeds.log('TheOldReader.prototype.getToken()');
    return this.theoldreader.token;
}

/**
 * updateToken()
 * Use "refresh_token" to obtain a new "access_token"
 * @todo Not yet implemented
 * @param   {null}
 * @return  {CustomEvent} TheOldReader.getNewToken.done | TheOldReader.getNewToken.error
 * */

TheOldReader.prototype.updateToken = function() {
    _MyFeeds.log('TheOldReader.prototype.getNewToken()');
    
    return new Promise(function(resolve, reject) {
        resolve('{}');
    });
}

/**
 * login(email, password)
 *
 * @param   {string} email
 * @param   {string} password
 * @return  {CustomEvent} TheOldReader.login.done | TheOldReader.login.error
 * */

TheOldReader.prototype.login = function(email, password) {
    _MyFeeds.log('TheOldReader.prototype.login()', arguments);
    
    _TheOldReader.theoldreader.email = email;
    _TheOldReader.theoldreader.password = password;
    
    var _url = _TheOldReader.theoldreader.host + '/accounts/ClientLogin';
    
    var _params = 'client=' + encodeURIComponent(_TheOldReader.theoldreader.client) + 
        '&Email=' + encodeURIComponent(_TheOldReader.theoldreader.email) +
        '&Passwd=' + encodeURIComponent(_TheOldReader.theoldreader.password) +
        '&accountType=' + encodeURIComponent(_TheOldReader.theoldreader.accountType) +
        '&output=' + encodeURIComponent(_TheOldReader.theoldreader.output);

    if (params.settings.proxy.use) {
        _urlParams = '&method=post&url=' + encodeURIComponent(_TheOldReader.theoldreader.host + '/accounts/ClientLogin?client=' + encodeURIComponent(_TheOldReader.theoldreader.client) + '&Email=' + encodeURIComponent(_TheOldReader.theoldreader.email) + '&Passwd=' + encodeURIComponent(_TheOldReader.theoldreader.password) + '&accountType=' + encodeURIComponent(_TheOldReader.theoldreader.accountType) + '&output=' + encodeURIComponent(_TheOldReader.theoldreader.output));
        _url = 'http://' + params.settings.proxy.host + '/proxy/theoldreader/?' + _urlParams;
    }   
 
    this.post(_url, _params, function(response) {
        if (_TheOldReader.setToken(response)) {
            _TheOldReader._saveParams(); // Save email, password
            response.lastModified = Math.floor(new Date().getTime() / 1000);
            _TheOldReader._save('cache/theoldreader/access_token.json', 'application/json', JSON.stringify(response));
            document.body.dispatchEvent(new CustomEvent('TheOldReader.login.done', {"detail": response}));
            _MyFeeds.log('CustomEvent : TheOldReader.login.done');
        } else {
            document.body.dispatchEvent(new CustomEvent('TheOldReader.login.error', {"detail": response}));
            _MyFeeds.log('CustomEvent : TheOldReader.login.error');
        }
    });

};

/**
 * getSubscriptions()
 *
 * @param   {null}
 * @return  {CustomEvent} TheOldReader.getSubscriptions.done | TheOldReader.getSubscriptions.error
 * */

TheOldReader.prototype.getSubscriptions = function () {
    _MyFeeds.log('TheOldReader.prototype.getSubscriptions()');
    
    var _url = _TheOldReader.theoldreader.host + '/reader/api/0/subscription/list' + 
            '?output=json';
    
    if (params.settings.proxy.use) {
        _urlParams = '&method=get&myAuth=' + _TheOldReader.theoldreader.token.Auth + '&url=' + encodeURIComponent(_TheOldReader.theoldreader.host + '/reader/api/0/subscription/list' + '?output=' + encodeURIComponent(_TheOldReader.theoldreader.output));
        _url = 'http://' + params.settings.proxy.host + '/proxy/theoldreader/?' + _urlParams;
    }   
    
    this.get(_url, '').then(function(response) {
        _TheOldReader.theoldreader.subscriptions = response;
        document.body.dispatchEvent(new CustomEvent('TheOldReader.getSubscriptions.done', {"detail": response}));
        _MyFeeds.log("CustomEvent : TheOldReader.getSubscriptions.done");
    }, function(error) {
        document.body.dispatchEvent(new CustomEvent('TheOldReader.getSubscriptions.error', {"detail": error}));
        _MyFeeds.error("CustomEvent : TheOldReader.getSubscriptions.error", error);
    });
}

/**
 * deleteSubscription(feedId)
 *
 * @param   {feedId} String Feed id
 * @return  {CustomEvent} TheOldReader.deleteSubscription.done | TheOldReader.deleteSubscription.error
 * */

TheOldReader.prototype.deleteSubscription = function (feedId) {
    _MyFeeds.log('TheOldReader.prototype.deleteSubscription()', arguments);
    
    return new Promise(function(resolve, reject) {
        
        var _url = _TheOldReader.theoldreader.host + '/reader/api/0/subscription/edit';
            
        var _params = 'output=json' + 
            '&ac=unsubscribe' + 
            '&s=' + encodeURIComponent(feedId);
        
        if (params.settings.proxy.use) {
            _urlParams = '&method=post&myAuth=' + _TheOldReader.theoldreader.token.Auth + '&url=' + encodeURIComponent(_TheOldReader.theoldreader.host + '/reader/api/0/subscription/edit' + '?output=' + encodeURIComponent(_TheOldReader.theoldreader.output) + '&ac=unsubscribe&s=' + encodeURIComponent(feedId));
            _url = 'http://' + params.settings.proxy.host + '/proxy/theoldreader/?' + _urlParams;
        }       
        
        _TheOldReader._delete(_url, _params).then(function(response) {
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
 
TheOldReader.prototype.get = function (_url, myParams) {
    _MyFeeds.log('TheOldReader.prototype.get()', arguments);
    
    return new Promise(function(resolve, reject) {
        
        var xhr = new XMLHttpRequest({ mozSystem: true });
        
        xhr.open('GET', _url, true);
        
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

        if (_TheOldReader.theoldreader.token) {
            xhr.setRequestHeader("Authorization", "GoogleLogin auth=" + _TheOldReader.theoldreader.token.Auth);
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
 
TheOldReader.prototype.post = function (_url, _params, callback) {
    _MyFeeds.log('TheOldReader.prototype.post()', arguments);
    
    return new Promise(function(resolve, reject) {

        var xhr = new XMLHttpRequest({ mozSystem: true });

        xhr.open('POST', _url, true);

        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
     
        if (_TheOldReader.theoldreader.token) {
            xhr.setRequestHeader("Authorization", "GoogleLogin auth=" + _TheOldReader.theoldreader.token.Auth);
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

TheOldReader.prototype._delete = function (url, params) {
    _MyFeeds.log('TheOldReader.prototype._delete()', arguments);
    
    return new Promise(function(resolve, reject) {

        var xhr = new XMLHttpRequest({ mozSystem: true });

        xhr.open('POST', url, true);

        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        
        if (_TheOldReader.theoldreader.token) {
            xhr.setRequestHeader("Authorization", "GoogleLogin auth=" + _TheOldReader.theoldreader.token.Auth);
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
