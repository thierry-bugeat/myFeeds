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

/* ======================= */
/* --- AolReader Class --- */
/* ======================= */

var AolReader = function() {
    
    MyFeeds.call(this); /* Appel du constructeur de la classe parente */

    this.aolreader = {
        "host_auth"     : "",
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
                "host_auth"     : "https://api.screenname.aol.com",
                "host"          : "https://reader.aol.com",
                "client_id"     : "",
                "client_secret" : "",
            },
            "prod" : 
            {
                "host_auth"     : "https://api.screenname.aol.com",
                "host"          : "https://reader.aol.com",
                "client_id"     : "my17TL5taEdwHzff",
                "client_secret" : "Rj9sO5tAVLaXnSDwULyF",
            }
        }
    };
    
    this.aolreader.host_auth       = this.aolreader.environments[this.aolreader.environment].host_auth;
    this.aolreader.host            = this.aolreader.environments[this.aolreader.environment].host;
    this.aolreader.client_id       = this.aolreader.environments[this.aolreader.environment].client_id;
    this.aolreader.client_secret   = this.aolreader.environments[this.aolreader.environment].client_secret;

    _AolReader = this;
}
AolReader.prototype = new MyFeeds();

/* =============== */
/* --- Methods --- */
/* =============== */

AolReader.prototype.setToken = function(token) {
    _MyFeeds.log('AolReader.prototype.setToken()', arguments);
    if (typeof token['access_token'] !== 'undefined') {
        this.aolreader.token = token;
        return 1;
    } else {
        document.body.dispatchEvent(new CustomEvent('AolReader.setToken.error', {"detail": token}));
        window.alert("Aol Reader Error : \n" + JSON.stringify(token));
        return 0;
    }
}

AolReader.prototype.getToken = function() {
    _MyFeeds.log('AolReader.prototype.getToken()');
    return this.aolreader.token;
}

/**
 * @param   {null}
 * @return  {CustomEvent} AolReader.login.done | AolReader.login.error
 * */

AolReader.prototype.login = function() {
    var _url = _AolReader.aolreader.host_auth + '/auth/authorize' +
        '?client_id=' + encodeURIComponent(_AolReader.aolreader.client_id) + 
        '&redirect_uri=' + encodeURIComponent('http://localhost:8080') + 
        '&response_type=code' + 
        '&scope=' + encodeURIComponent('subscriptions');

    window.open(_url);
    return false;
};

AolReader.prototype._loginCallback = function(url) {
    _MyFeeds.log('AolReader.prototype._loginCallback()', arguments);

    var params = [];

    if (params = url.match(/code=([^&]+)/)) {
        
        _AolReader.aolreader.code = params[1];
        
        var _url = _AolReader.aolreader.host_auth + '/auth/access_token';
        
        var _params = 'code=' + encodeURIComponent(params[1]) + 
                '&client_id=' + encodeURIComponent(_AolReader.aolreader.client_id) +
                '&client_secret=' + encodeURIComponent(_AolReader.aolreader.client_secret) +
                '&redirect_uri=' + encodeURIComponent('http://localhost:8080') +
                '&state=' + encodeURIComponent(params[0]) +
                '&grant_type=authorization_code';
        
        this.post(_url, _params, function(response) {
            if (_AolReader.setToken(response)) {
                response.lastModified = Math.floor(new Date().getTime() / 1000);
                _AolReader._save('cache/aolreader/access_token.json', 'application/json', JSON.stringify(response));
                document.body.dispatchEvent(new CustomEvent('AolReader.login.done', {"detail": response}));
                _MyFeeds.log('CustomEvent : AolReader.login.done');
            } else {
                document.body.dispatchEvent(new CustomEvent('AolReader.login.error', {"detail": response}));
                _MyFeeds.log('CustomEvent : AolReader.login.error');
            }
        });
        
    } else {
        window.alert('AolReader login error');
        document.body.dispatchEvent(new CustomEvent('AolReader.login.error', {"detail": "AolReader login error"}));
        _MyFeeds.log('CustomEvent : AolReader.login.error');
    }
}

/**
 * @param   {null}
 * @return  {CustomEvent} AolReader.getSubscriptions.done | AolReader.getSubscriptions.error
 * */

AolReader.prototype.getSubscriptions = function () {
    _MyFeeds.log('AolReader.prototype.getSubscriptions()');
    
    var _url = _AolReader.aolreader.host + '/reader/api/0/subscription/list' + 
        '?access_token=' + _AolReader.aolreader.token.access_token;
console.log("bugeat", _AolReader.aolreader.token);
    var promise = this.get(_url, '');
    
    promise.then(function(response) {
        _MyFeeds.log(response);
        document.body.dispatchEvent(new CustomEvent('AolReader.getSubscriptions.done', {"detail": response}));
        _MyFeeds.log("CustomEvent : AolReader.getSubscriptions.done");
    }, function(error) {
        document.body.dispatchEvent(new CustomEvent('AolReader.getSubscriptions.error', {"detail": error}));
        _MyFeeds.error("CustomEvent : AolReader.getSubscriptions.error", error);
    });
}

/**
 * Use "refresh_token" to obtain a new "access_token"
 * @param   {null}
 * @return  {CustomEvent} AolReader.getNewToken.done | AolReader.getNewToken.error
 * */

AolReader.prototype.updateToken = function() {
    _MyFeeds.log('AolReader.prototype.getNewToken()');
    
    var _url = _AolReader.aolreader.host_auth + '/auth/access_token';

    var _params = 'refresh_token=' + encodeURIComponent(_AolReader.aolreader.token.refresh_token) + 
        '&client_id=' + encodeURIComponent(_AolReader.aolreader.client_id) +
        '&client_secret=' + encodeURIComponent(_AolReader.aolreader.client_secret) +
        '&grant_type=refresh_token';

    this.post(_url, _params, function(response) {
        if (typeof response['errorMessage'] !== 'undefined') {
            window.alert("AolReader Error : \n" + JSON.stringify(response));
            _MyFeeds.log('CustomEvent : AolReader.getNewToken.error');
        } else {
            _AolReader.aolreader.token.access_token = response.access_token;
            _AolReader.aolreader.token.lastModified = Math.floor(new Date().getTime() / 1000);
            _AolReader._save('cache/aolreader/access_token.json', 'application/json', JSON.stringify(_AolReader.aolreader.token));
            _AolReader._save('cache/aolreader/access_token.new.json', 'application/json', JSON.stringify(response));
            document.body.dispatchEvent(new CustomEvent('AolReader.getNewToken.done', {"detail": response}));
            _MyFeeds.log('CustomEvent : AolReader.getNewToken.done', response);
        }
    });
}

/**
 * @param   {feedId} String Feed url
 * @return  {CustomEvent} AolReader.deleteSubscription.done | AolReader.deleteSubscription.error
 * */

AolReader.prototype.deleteSubscription = function (feedId) {
    _MyFeeds.log('AolReader.prototype.deleteSubscription()', arguments);
    
    return new Promise(function(resolve, reject) {
        
        var _url = _AolReader.aolreader.host + '/reader/api/0/subscription/edit';
        
        var _params = 'access_token=' + encodeURIComponent(_AolReader.aolreader.token.access_token) + 
        '&ac=unsubscribe' +
        '&s=' + encodeURIComponent(feedId);
        
        var promise = _AolReader.post(_url, _params);

        promise.then(function(response) {
            document.body.dispatchEvent(new CustomEvent('AolReader.deleteSubscription.done', {"detail": response}));
            _MyFeeds.log("CustomEvent : AolReader.deleteSubscription.done");
            resolve(response);
        }).catch(function(error) {
            document.body.dispatchEvent(new CustomEvent('AolReader.deleteSubscription.error', {"detail": error}));
            _MyFeeds.error("CustomEvent : AolReader.deleteSubscription.error", error);
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
 
AolReader.prototype.get = function (url, myParams) {
    _MyFeeds.log('AolReader.prototype.get()', arguments);
    
    return new Promise(function(resolve, reject) {
        
        var xhr = new XMLHttpRequest({ mozSystem: true });
        
        xhr.open('GET', url);
        
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

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
 
AolReader.prototype.post = function (url, params, callback) {
    _MyFeeds.log('AolReader.prototype.post()', arguments);
    
    return new Promise(function(resolve, reject) {

        var xhr = new XMLHttpRequest({ mozSystem: true });

        xhr.open('POST', url, true);

        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        
        if (_AolReader.aolreader.token) {
            xhr.setRequestHeader("Authorization", "OAuth " + _AolReader.aolreader.token.access_token);
        }

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
