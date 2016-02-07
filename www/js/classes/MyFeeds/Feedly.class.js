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

/* ==================== */
/* --- Feedly Class --- */
/* ==================== */

var Feedly = function() {
    
    //MyFeeds.call(this); /* Appel du constructeur de la classe parente */

    this.feedly = {
        "host"          : "",
        "client_id"     : "",
        "client_secret" : "",
        "method"        : "GET",
        "code"          : "",
        "token"         : {},
        "environment"   : "prod", // dev, prod
        "environments"  : {
            "dev" : 
            {
                "host"          : "https://sandbox.feedly.com",
                "client_id"     : "sandbox",
                "client_secret" : "A4143F56J75FGQY7TAJM",
            },
            "prod" : 
            {
                "host"          : "https://feedly.com",
                "client_id"     : "myfeeds",
                "client_secret" : "FE01MWBCIPM6HU8LHAW2215UPUFO",
            }
        }
    };
    
    this.feedly.host            = this.feedly.environments[this.feedly.environment].host;
    this.feedly.client_id       = this.feedly.environments[this.feedly.environment].client_id;
    this.feedly.client_secret   = this.feedly.environments[this.feedly.environment].client_secret;

    _Feedly = this;
}
Feedly.prototype = new MyFeeds();

/* =============== */
/* --- Methods --- */
/* =============== */

Feedly.prototype.setToken = function(token) {
    _MyFeeds.log('Feedly.prototype.setToken()', arguments);
    if (typeof token['access_token'] !== 'undefined') {
        this.feedly.token = token;
        return 1;
    } else {
        document.body.dispatchEvent(new CustomEvent('Feedly.setToken.error', {"detail": token}));
        window.alert("Feedly Error : \n" + JSON.stringify(token));
        return 0;
    }
}

Feedly.prototype.getToken = function() {
    _MyFeeds.log('Feedly.prototype.getToken()');
    return this.feedly.token;
}

/**
 * Use "refresh_token" to obtain a new "access_token"
 * @param   {null}
 * @return  {CustomEvent} Feedly.getNewToken.done | Feedly.getNewToken.error
 * */

Feedly.prototype.updateToken = function() {
    _MyFeeds.log('Feedly.prototype.getNewToken()');
    
    return new Promise(function(resolve, reject) {
        
        var _url = _Feedly.feedly.host + '/v3/auth/token';

        var _params = 'refresh_token=' + encodeURIComponent(_Feedly.feedly.token.refresh_token) + 
            '&client_id=' + encodeURIComponent(_Feedly.feedly.client_id) +
            '&client_secret=' + encodeURIComponent(_Feedly.feedly.client_secret) +
            '&grant_type=refresh_token';

        var promise = _Feedly.post(_url, _params);
        
        promise.then(function(response) {
            if (typeof response['errorMessage'] !== 'undefined') {
                window.alert("Feedly Error : \n" + JSON.stringify(response));
                _MyFeeds.log('CustomEvent : Feedly.getNewToken.error');
            } else {
                _Feedly.feedly.token.access_token = response.access_token;
                _Feedly.feedly.token.lastModified = Math.floor(new Date().getTime() / 1000);
                _Feedly._save('cache/feedly/access_token.json', 'application/json', JSON.stringify(_Feedly.feedly.token));
                _Feedly._save('cache/feedly/access_token.new.json', 'application/json', JSON.stringify(response));
                document.body.dispatchEvent(new CustomEvent('Feedly.getNewToken.done', {"detail": response}));
                _MyFeeds.log('CustomEvent : Feedly.getNewToken.done');
            }
        }).catch(function(error) {
            document.body.dispatchEvent(new CustomEvent('Feedly.getNewToken.error', {"detail": error}));
            _MyFeeds.error("CustomEvent : Feedly.getNewToken.error", error);
            reject(Error(JSON.stringify(error)));
        });
    
    });
}

/**
 * @param   {null}
 * @return  {CustomEvent} Feedly.login.done | Feedly.login.error
 * */

Feedly.prototype.login = function() {
    var _url = _Feedly.feedly.host + '/v3/auth/auth' +
        '?client_id=' + encodeURIComponent(_Feedly.feedly.client_id) + 
        '&redirect_uri=' + encodeURIComponent('http://localhost') + 
        '&response_type=code' + 
        '&scope=' + encodeURIComponent('https://cloud.feedly.com/subscriptions');

    /*if (params.settings.proxy.use) {
        _urlParams = '&url=' + encodeURIComponent(_Feedly.feedly.host + '/v3/auth/auth?client_id=' + encodeURIComponent(_Feedly.feedly.client_id) + '&redirect_uri=' + encodeURIComponent('http://localhost') + '&response_type=code' + '&scope=' + encodeURIComponent('https://cloud.feedly.com/subscriptions'));
        _url = 'http://' + params.settings.proxy.host + '/proxy/?' + _urlParams;
    }*/   
 
    var _inAppBrowser = window.open(_url, '_blank', 'location=yes');
    
    _inAppBrowser.addEventListener('loadstart', function(event) {
        //_MyFeeds.log(event);
        if (event.url.match(/^http:\/\/localhost/)) {
            if (event.url.match(/code=([^&]+)/)) {
                _inAppBrowser.close();
                _Feedly._loginCallback(event.url);
            }
        }
    });

    return false;
};

Feedly.prototype._loginCallback = function(url) {
    _MyFeeds.log('Feedly.prototype._loginCallback()', arguments);

    var urlParams = [];
    
    if (urlParams = url.match(/code=([^&]+)/)) {
        
        _Feedly.feedly.code = urlParams[1];
        
        var _url = _Feedly.feedly.host + '/v3/auth/token';

        var _params = 'code=' + encodeURIComponent(urlParams[1]) + 
                '&client_id=' + encodeURIComponent(_Feedly.feedly.client_id) +
                '&client_secret=' + encodeURIComponent(_Feedly.feedly.client_secret) +
                '&redirect_uri=' + encodeURIComponent('http://localhost/') +
                '&state=' + encodeURIComponent(urlParams[0]) +
                '&grant_type=authorization_code';

        /*if (params.settings.proxy.use) {
            _urlParams = 'url=' + encodeURIComponent(_Feedly.feedly.host + '/v3/auth/token?code=' + urlParams[1] + '&client_id=' + _Feedly.feedly.client_id + '&redirect_uri=' + encodeURIComponent('http://localhost') + '&state=' + urlParams[0] + '&grant_type=authorization_code');
            _url = 'http://' + params.settings.proxy.host + '/proxy/?' + _urlParams;
        }*/   
        
        this.post(_url, _params, function(response) {
            if (_Feedly.setToken(response)) {
                response.lastModified = Math.floor(new Date().getTime() / 1000);
                _Feedly._save('cache/feedly/access_token.json', 'application/json', JSON.stringify(response));
                document.body.dispatchEvent(new CustomEvent('Feedly.login.done', {"detail": response}));
                _MyFeeds.log('CustomEvent : Feedly.login.done');
            } else {
                document.body.dispatchEvent(new CustomEvent('Feedly.login.error', {"detail": response}));
                _MyFeeds.log('CustomEvent : Feedly.login.error');
            }
        });
        
    } else {
        window.alert('Feedly login error');
        document.body.dispatchEvent(new CustomEvent('Feedly.login.error', {"detail": "Feedly login error"}));
        _MyFeeds.log('CustomEvent : Feedly.login.error');
    }
}

/**
 * @param   {null}
 * @return  {CustomEvent} Feedly.getSubscriptions.done | Feedly.getSubscriptions.error
 * */

Feedly.prototype.getSubscriptions = function () {
    _MyFeeds.log('Feedly.prototype.getSubscriptions()');
    
    var _url = _Feedly.feedly.host + '/v3/subscriptions' + 
            '?output=json';

    if (params.settings.proxy.use) {
        _urlParams = '&url=' + encodeURIComponent(_Feedly.feedly.host + '/v3/subscriptions?output=json');
        _url = 'http://' + params.settings.proxy.host + '/proxy/?' + _urlParams;
    }   
    
    var promise = this.get(_url, '');
    
    promise.then(function(response) {
        _MyFeeds.log(response);
        document.body.dispatchEvent(new CustomEvent('Feedly.getSubscriptions.done', {"detail": response}));
        _MyFeeds.log("CustomEvent : Feedly.getSubscriptions.done");
    }, function(error) {
        document.body.dispatchEvent(new CustomEvent('Feedly.getSubscriptions.error', {"detail": error}));
        _MyFeeds.error("CustomEvent : Feedly.getSubscriptions.error", error);
    });
}

/**
 * @param   {feedId} String Feed url
 * @return  {CustomEvent} Feedly.deleteSubscription.done | Feedly.deleteSubscription.error
 * */

Feedly.prototype.deleteSubscription = function (feedId) {
    _MyFeeds.log('Feedly.prototype.deleteSubscription()', arguments);
    
    return new Promise(function(resolve, reject) {
        
        var _url = _Feedly.feedly.host + '/v3/subscriptions/' + encodeURIComponent(feedId);
        
        var promise = _Feedly._delete(_url, '');

        promise.then(function(response) {
            document.body.dispatchEvent(new CustomEvent('Feedly.deleteSubscription.done', {"detail": response}));
            _MyFeeds.log("CustomEvent : Feedly.deleteSubscription.done");
            resolve(response);
        }).catch(function(error) {
            document.body.dispatchEvent(new CustomEvent('Feedly.deleteSubscription.error', {"detail": error}));
            _MyFeeds.error("CustomEvent : Feedly.deleteSubscription.error", error);
            reject(Error(JSON.stringify(error)));
        });
    
    });
}

/**
 * get(url, myParams)
 * 
 * @param string url Url to load.
 * @param object myParams You can retrieve this object in response.
 * 
 * */
 
Feedly.prototype.get = function (url, myParams) {
    _MyFeeds.log('Feedly.prototype.get()', arguments);
    
    return new Promise(function(resolve, reject) {
        
        var xhr = new XMLHttpRequest({ mozSystem: true });
        
        xhr.open('GET', url);
        
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        
        if (_Feedly.feedly.token) {
            xhr.setRequestHeader("Authorization", "OAuth " + _Feedly.feedly.token.access_token);
        }

        xhr.onload = function() {
            if (xhr.status == 200) {

                var _response = JSON.parse(xhr.response);

                try {
                    //_response.responseData._myParams = myParams; // Add extra values
                    resolve(_response);
                } catch(err) {
                    //reject(Error(xhr.statusText));
                    //var _response = {"responseData": {"_myParams": myParams}};
                    //reject(Error(_response));
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
 
Feedly.prototype.post = function (url, params, callback) {
    _MyFeeds.log('Feedly.prototype.post()', arguments);
    
    return new Promise(function(resolve, reject) {

        var xhr = new XMLHttpRequest({ mozSystem: true });

        xhr.open('POST', url, true);

        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

        xhr.onload = function() {
            var _response = JSON.parse(xhr.response);
            typeof callback === 'function' && callback(_response);
        };

        xhr.onerror = function(e) {
            typeof callback === 'function' && callback(Error(e));
        };
        
        xhr.send(params);
    });
}

/**
 * _delete(url, callback)
 * 
 * @param {string} url Url to load.
 * @param {string} callback.
 * 
 * */
 
Feedly.prototype._delete = function (url, callback) {
    _MyFeeds.log('Feedly.prototype._delete()', arguments);
    
    return new Promise(function(resolve, reject) {

        var xhr = new XMLHttpRequest({ mozSystem: true });

        xhr.open('DELETE', url, true);

        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

        if (_Feedly.feedly.token) {
            xhr.setRequestHeader("Authorization", "OAuth " + _Feedly.feedly.token.access_token);
        }

        xhr.onload = function() {
            var _response = JSON.parse(xhr.response);
            try {
                resolve(_response);
            } catch(err) {
                reject(Error(JSON.stringify(err)));
            }
        };

        xhr.onerror = function(e) {
            reject(Error(JSON.stringify(err)));
        };
        
        xhr.send(params);
    });
}
