
/* ============================ */
/* --- The Old Reader Class --- */
/* ============================ */

var TheOldReader = function() {
    
    MyFeeds.call(this); /* Appel du constructeur de la classe parente */

    this.tor = {
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

TheOldReader.prototype.setToken = function(token) {
    _MyFeeds.log('TheOldReader.prototype.setToken()', arguments);
    if (typeof token['Auth'] !== 'undefined') {
        this.tor.token = token;
        return 1;
    } else {
        document.body.dispatchEvent(new CustomEvent('TheOldReader.setToken.error', {"detail": token}));
        window.alert("The Old Reader Error : \n" + JSON.stringify(token));
        return 0;
    }
}

TheOldReader.prototype.getToken = function() {
    _MyFeeds.log('TheOldReader.prototype.getToken()');
    return this.tor.token;
}

/**
 * @param   {string} email
 * @param   {string} password
 * @return  {CustomEvent} TheOldReader.login.done | TheOldReader.login.error
 * */

TheOldReader.prototype.login = function(email, password) {
    _MyFeeds.log('TheOldReader.prototype.login()', arguments);
    
    _TheOldReader.tor.email = email;
    _TheOldReader.tor.password = password;
    
    var _url = _TheOldReader.tor.host + '/accounts/ClientLogin';
    
    var _params = 'client=' + encodeURIComponent(_TheOldReader.tor.client) + 
        '&Email=' + encodeURIComponent(_TheOldReader.tor.email) +
        '&Passwd=' + encodeURIComponent(_TheOldReader.tor.password) +
        '&accountType=' + encodeURIComponent(_TheOldReader.tor.accountType) +
        '&output=' + encodeURIComponent(_TheOldReader.tor.output);

    this.post(_url, _params, function(response) {
        if (_TheOldReader.setToken(response)) {
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
 * @param   {null}
 * @return  {CustomEvent} TheOldReader.getSubscriptions.done | TheOldReader.getSubscriptions.error
 * */

TheOldReader.prototype.getSubscriptions = function () {
    _MyFeeds.log('TheOldReader.prototype.getSubscriptions()');
    
    var _url = _TheOldReader.tor.host + '/reader/api/0/subscription/list' + 
            '?output=json';
    
    var promise = this.get(_url, '');
    
    promise.then(function(response) {
        _TheOldReader.tor.subscriptions = response;
        document.body.dispatchEvent(new CustomEvent('TheOldReader.getSubscriptions.done', {"detail": response}));
        _MyFeeds.log("CustomEvent : TheOldReader.getSubscriptions.done");
    }, function(error) {
        document.body.dispatchEvent(new CustomEvent('TheOldReader.getSubscriptions.error', {"detail": error}));
        _MyFeeds.error("CustomEvent : TheOldReader.getSubscriptions.error", error);
    });
}

/**
 * @param   {feedId} String Feed id
 * @return  {CustomEvent} TheOldReader.deleteSubscription.done | TheOldReader.deleteSubscription.error
 * */

TheOldReader.prototype.deleteSubscription = function (feedId) {
    _MyFeeds.log('TheOldReader.prototype.deleteSubscription()', arguments);
    
    return new Promise(function(resolve, reject) {
        
        var _url = _TheOldReader.tor.host + '/reader/api/0/subscription/edit';
            
        var _params = 'output=json' + 
            '&ac=unsubscribe' + 
            '&s=' + encodeURIComponent(feedId);
        
        var promise = _TheOldReader._delete(_url, _params, '');
        
        promise.then(function(response) {
            resolve(response);
        }).catch(function(error) {
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
 
TheOldReader.prototype.get = function (url, myParams) {
    _MyFeeds.log('TheOldReader.prototype.get()', arguments);
    
    return new Promise(function(resolve, reject) {
        
        var xhr = new XMLHttpRequest({ mozSystem: true });
        
        xhr.open('GET', url);
        
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

        if (_TheOldReader.tor.token) {
            xhr.setRequestHeader("Authorization", "GoogleLogin auth=" + _TheOldReader.tor.token.Auth);
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
 
TheOldReader.prototype.post = function (url, params, callback) {
    _MyFeeds.log('TheOldReader.prototype.post()', arguments);
    
    return new Promise(function(resolve, reject) {

        var xhr = new XMLHttpRequest({ mozSystem: true });

        xhr.open('POST', url, true);

        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        
        if (_TheOldReader.tor.token) {
            xhr.setRequestHeader("Authorization", "GoogleLogin auth=" + _TheOldReader.tor.token.Auth);
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
        
        xhr.send(params);
    });
}


TheOldReader.prototype._delete = function (url, params, callback) {
    _MyFeeds.log('TheOldReader.prototype.post222()', arguments);
    
    return new Promise(function(resolve, reject) {

        var xhr = new XMLHttpRequest({ mozSystem: true });

        xhr.open('POST', url, true);

        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        
        if (_TheOldReader.tor.token) {
            xhr.setRequestHeader("Authorization", "GoogleLogin auth=" + _TheOldReader.tor.token.Auth);
        }

        xhr.onload = function() {
            
            if (xhr.status == 200) {

                //var _response = JSON.parse(xhr.response);
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

        xhr.onerror = function(err) {
            reject(Error(JSON.stringify(err)));
        };
        
        xhr.send(params);
    });
}
