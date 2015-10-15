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

/* =================== */
/* --- Yahoo Class --- */
/* =================== */

var Yahoo = function() {
    
    MyFeeds.call(this); /* Appel du constructeur de la classe parente */

    this.yahoo = {
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
                "host_auth"     : "",
                "host"          : "",
                "client_id"     : "",
                "client_secret" : "",
            },
            "prod" : 
            {
                "host_auth"     : "https://api.login.yahoo.com",
                "host"          : "https://query.yahooapis.com",
                "client_id"     : "dj0yJmk9dzFmVHpUREtNMTZxJmQ9WVdrOWVsZGhibXN4TldNbWNHbzlNQS0tJnM9Y29uc3VtZXJzZWNyZXQmeD05NA--",
                "client_secret" : "a33676e57a4fe55dbdb5f36da05edff5781d4230",
            }
        }
    };
    
    this.yahoo.host_auth       = this.yahoo.environments[this.yahoo.environment].host_auth;
    this.yahoo.host            = this.yahoo.environments[this.yahoo.environment].host;
    this.yahoo.client_id       = this.yahoo.environments[this.yahoo.environment].client_id;
    this.yahoo.client_secret   = this.yahoo.environments[this.yahoo.environment].client_secret;

    _Yahoo = this;
}
Yahoo.prototype = new MyFeeds();

/* =============== */
/* --- Methods --- */
/* =============== */

Yahoo.prototype.setToken = function(token) {
    _MyFeeds.log('Yahoo.prototype.setToken()', arguments);
    if (typeof token['access_token'] !== 'undefined') {
        this.yahoo.token = token;
        return 1;
    } else {
        document.body.dispatchEvent(new CustomEvent('Yahoo.setToken.error', {"detail": token}));
        window.alert("Yahoo Error : \n" + JSON.stringify(token));
        return 0;
    }
}

Yahoo.prototype.getToken = function() {
    _MyFeeds.log('Yahoo.prototype.getToken()');
    return this.yahoo.token;
}

/**
 * Use "refresh_token" to obtain a new "access_token"
 * @param   {null}
 * @return  {CustomEvent} Yahoo.getNewToken.done | Yahoo.getNewToken.error
 * */

Yahoo.prototype.updateToken = function() {
    _MyFeeds.log('Yahoo.prototype.getNewToken()');
    
    var _url = _Yahoo.yahoo.host + '/v3/auth/token';

    var _params = 'refresh_token=' + encodeURIComponent(_Yahoo.yahoo.token.refresh_token) + 
        '&client_id=' + encodeURIComponent(_Yahoo.yahoo.client_id) +
        '&client_secret=' + encodeURIComponent(_Yahoo.yahoo.client_secret) +
        '&grant_type=refresh_token';

    this.post(_url, _params, function(response) {
        if (typeof response['errorMessage'] !== 'undefined') {
            window.alert("Yahoo Error : \n" + JSON.stringify(response));
            _MyFeeds.log('CustomEvent : Yahoo.getNewToken.error');
        } else {
            _Yahoo.yahoo.token.access_token = response.access_token;
            _Yahoo.yahoo.token.lastModified = Math.floor(new Date().getTime() / 1000);
            _Yahoo._save('cache/Yahoo/access_token.json', 'application/json', JSON.stringify(_Yahoo.yahoo.token));
            _Yahoo._save('cache/Yahoo/access_token.new.json', 'application/json', JSON.stringify(response));
            document.body.dispatchEvent(new CustomEvent('Yahoo.getNewToken.done', {"detail": response}));
            _MyFeeds.log('CustomEvent : Yahoo.getNewToken.done');
        }
    });
}

/**
 * Documentation: https://developer.yahoo.com/oauth/guide/oauth-requesttoken.html
 * @param   {null}
 * @return  {CustomEvent} Yahoo.login.done | Yahoo.login.error
 * */

Yahoo.prototype.loginV1 = function() {
    var _url = _Yahoo.yahoo.host_auth + '/oauth/v2/get_request_token' +
        '?oauth_nonce=fe2130523f788f313f76314ed3965ea7' +  
        '&oauth_timestamp=' + encodeURIComponent(Math.floor(new Date().getTime() / 1000)) + 
        '&oauth_consumer_key=' + encodeURIComponent(_Yahoo.yahoo.client_id) +
        '&oauth_signature_method=PLAINTEXT' + 
        '&oauth_signature=' + encodeURIComponent(_Yahoo.yahoo.client_secret) + '%26' +
        '&oauth_version=1.0' + 
        '&oauth_callback=' + encodeURIComponent('oob'); 

    console.log(_url);
    window.open(_url);
    return false;
};

/**
 * @param   {null}
 * @return  {CustomEvent} Yahoo.login.done | Yahoo.login.error
 * */

Yahoo.prototype.login = function() {
    var _url = _Yahoo.yahoo.host_auth + '/oauth2/request_auth' +
        '?client_id=' + encodeURIComponent(_Yahoo.yahoo.client_id) + 
        '&redirect_uri=' + encodeURIComponent('http://localhost:8081') + 
        '&response_type=code';

    window.open(_url);
    return false;
};

Yahoo.prototype._loginCallback = function(url) {
    _MyFeeds.log('Yahoo.prototype._loginCallback()', arguments);

    var params = [];
    
    if (params = url.match(/code=([^&]+)/)) {
        
        _Yahoo.yahoo.code = params[1];
        
        var _url = _Yahoo.yahoo.host + '/v3/auth/token';

        var _params = 'code=' + encodeURIComponent(params[1]) + 
                '&client_id=' + encodeURIComponent(_Yahoo.yahoo.client_id) +
                '&client_secret=' + encodeURIComponent(_Yahoo.yahoo.client_secret) +
                '&redirect_uri=' + encodeURIComponent('http://localhost/') +
                '&state=' + encodeURIComponent(params[0]) +
                '&grant_type=authorization_code';
        
        this.post(_url, _params, function(response) {
            if (_Yahoo.setToken(response)) {
                response.lastModified = Math.floor(new Date().getTime() / 1000);
                _Yahoo._save('cache/Yahoo/access_token.json', 'application/json', JSON.stringify(response));
                document.body.dispatchEvent(new CustomEvent('Yahoo.login.done', {"detail": response}));
                _MyFeeds.log('CustomEvent : Yahoo.login.done');
            } else {
                document.body.dispatchEvent(new CustomEvent('Yahoo.login.error', {"detail": response}));
                _MyFeeds.log('CustomEvent : Yahoo.login.error');
            }
        });
        
    } else {
        window.alert('Yahoo login error');
        document.body.dispatchEvent(new CustomEvent('Yahoo.login.error', {"detail": "Yahoo login error"}));
        _MyFeeds.log('CustomEvent : Yahoo.login.error');
    }
}

/**
 * @param   {null}
 * @return  {CustomEvent} Yahoo.getSubscriptions.done | Yahoo.getSubscriptions.error
 * */

Yahoo.prototype.getSubscriptions = function () {
    _MyFeeds.log('Yahoo.prototype.getSubscriptions()');
    
    var _url = _Yahoo.yahoo.host + '/v3/subscriptions' + 
            '?output=json';
    
    var promise = this.get(_url, '');
    
    promise.then(function(response) {
        _MyFeeds.log(response);
        document.body.dispatchEvent(new CustomEvent('Yahoo.getSubscriptions.done', {"detail": response}));
        _MyFeeds.log("CustomEvent : Yahoo.getSubscriptions.done");
    }, function(error) {
        document.body.dispatchEvent(new CustomEvent('Yahoo.getSubscriptions.error', {"detail": error}));
        _MyFeeds.error("CustomEvent : Yahoo.getSubscriptions.error", error);
    });
}

/**
 * @param   {feedId} String Feed url
 * @return  {CustomEvent} Yahoo.deleteSubscription.done | Yahoo.deleteSubscription.error
 * */

Yahoo.prototype.deleteSubscription = function (feedId) {
    _MyFeeds.log('Yahoo.prototype.deleteSubscription()', arguments);
    
    return new Promise(function(resolve, reject) {
        
        var _url = _Yahoo.yahoo.host + '/v3/subscriptions/' + encodeURIComponent(feedId);
        
        var promise = _Yahoo._delete(_url, '');

        promise.then(function(response) {
            document.body.dispatchEvent(new CustomEvent('Yahoo.deleteSubscription.done', {"detail": response}));
            _MyFeeds.log("CustomEvent : Yahoo.deleteSubscription.done");
            resolve(response);
        }).catch(function(error) {
            document.body.dispatchEvent(new CustomEvent('Yahoo.deleteSubscription.error', {"detail": error}));
            _MyFeeds.error("CustomEvent : Yahoo.deleteSubscription.error", error);
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
 
Yahoo.prototype.get = function (url, myParams) {
    _MyFeeds.log('Yahoo.prototype.get()', arguments);
    
    return new Promise(function(resolve, reject) {
        
        var xhr = new XMLHttpRequest({ mozSystem: true });
        
        xhr.open('GET', url);
        
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        
        if (_Yahoo.yahoo.token) {
            xhr.setRequestHeader("Authorization", "OAuth " + _Yahoo.yahoo.token.access_token);
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
 
Yahoo.prototype.post = function (url, params, callback) {
    _MyFeeds.log('Yahoo.prototype.post()', arguments);
    
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
 
Yahoo.prototype._delete = function (url, callback) {
    _MyFeeds.log('Yahoo.prototype._delete()', arguments);
    
    return new Promise(function(resolve, reject) {

        var xhr = new XMLHttpRequest({ mozSystem: true });

        xhr.open('DELETE', url, true);

        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

        if (_Yahoo.yahoo.token) {
            xhr.setRequestHeader("Authorization", "OAuth " + _Yahoo.yahoo.token.access_token);
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
