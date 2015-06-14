
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
        "token"         : {}
    };

    _TheOldReader = this;
}
TheOldReader.prototype = new MyFeeds();

/* =============== */
/* --- Methods --- */
/* =============== */

TheOldReader.prototype.setToken = function(token) {
    console.log('TheOldReader.prototype.setToken()', arguments);
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
    console.log('TheOldReader.prototype.getToken()');
    return this.tor.token;
}

/**
 * @param   {string} email
 * @param   {string} password
 * @return  {CustomEvent} TheOldReader.login.done | TheOldReader.login.error
 * */

TheOldReader.prototype.login = function(email, password) {
    console.log('TheOldReader.prototype.login()', arguments);
    
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
            console.log('CustomEvent : TheOldReader.login.done');
        } else {
            document.body.dispatchEvent(new CustomEvent('TheOldReader.login.error', {"detail": response}));
            console.log('CustomEvent : TheOldReader.login.error');
        }
    });

};

/**
 * @param   {null}
 * @return  {CustomEvent} TheOldReader.getSubscriptions.done | TheOldReader.getSubscriptions.error
 * */

TheOldReader.prototype.getSubscriptions = function () {
    console.log('TheOldReader.prototype.getSubscriptions()');
    
    var _url = _TheOldReader.tor.host + '/reader/api/0/subscription/list' + 
            '?output=json';
    
    var promise = this.get(_url, '');
    
    promise.then(function(response) {
        document.body.dispatchEvent(new CustomEvent('TheOldReader.getSubscriptions.done', {"detail": response}));
        console.log("CustomEvent : TheOldReader.getSubscriptions.done");
    }, function(error) {
        document.body.dispatchEvent(new CustomEvent('TheOldReader.getSubscriptions.error', {"detail": error}));
        console.error("CustomEvent : TheOldReader.getSubscriptions.error", error);
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
    console.log('TheOldReader.prototype.get()', arguments);
    
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
    console.log('TheOldReader.prototype.post()', arguments);
    
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
