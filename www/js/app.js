/**
 * Copyright 2015,2016,2017 Thierry BUGEAT
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
    
    var my = new MyFeeds();
    var ui = new MyUi();
    var css = new MyCss();    
    var myManifest = my._loadJSON('manifest.webapp');

    var theoldreader = new TheOldReader();
    var feedly = new Feedly();
    var aolreader = new AolReader();
    var tinytinyrss = new TinyTinyRss();
    var wallabag = new Wallabag();

    var sp = new SimplePie();

    var myFeedsSubscriptions = {'local': [], 'aolreader': [], 'feedly': [], 'theoldreader': [], 'tinytinyrss': []} ; // Store informations about feeds (urls)

    var params = {
        "version": 2.51,                        // Don't forget to increase this value if you do changes in "params" object
        "changelog": "https://git.framasoft.org/thierry-bugeat/myFeeds/raw/master/CHANGELOG",
        "feeds": {
            "selectedFeed": {
                "url": "",                      // Display all feeds if empty otherwise display specified feed url
                "account": "",                  // (See also "liveValues.sync.selectedFeed")
                "domId": ""
            },
            "selectedKeyword": {
                "value": "",
                "domId": ""
            },                 
            "defaultPulsations": 5,             // Default feed pulsations
            "count": false                      // Display count of entries in feeds list.
        },
        "entries": {
            "nbDaysAgo": 0,                     // Display only today's entries
            "maxLengthForSmallEntries": "400",  // Max number of characters to display an entry as small entry
            "dontDisplayEntriesOlderThan": "7", // In days
            "displaySmallEntries": false,       // Display small entries. true, false
            "updateEvery": 900,                 // Update entries every N seconds
            "theme": "list"                     // card, list(default), grid
        },
        "accounts": {
            "local": {
                "title": "Local",
                "logged": true
            },
            "feedly": {
                "title": "Feedly",
                "logged": false
            },
            "theoldreader": {
                "title": "The Old Reader",
                "logged": false
            },
            "aolreader": {
                "title": "Aol Reader",
                "logged": false
            },
            "tinytinyrss": {
                "title": "Tiny Tiny Rss",
                "logged": false
            },
            "wallabag": {
                "title": "Wallabag",
                "logged": false
            }
        },
        "settings": {
            "ui": {
                "animations": false,            // Use transitions animations
                "vibrate": true,                // Vibration on click
                "language": ""                  // Language
            },
            "developper_menu": {
                "visible": false,               // Display or not developper menu in settings
                "logs": {
                    "console": false,           // Developper logs in console
                    "screen": false             // Developper logs on screen
                }
            },
            "update": {
                "every": [300, 900, 1800, 3600] // In seconds 5mn, 15mn, 30mn, 60mn
            },
            "days": [3, 5, 7, 10],              // Display news up to N days in the past
            "proxy": {
                "use": false,                   // Use proxy to get url content
                "host": "54.229.143.103",
                "availability": {
                    "local": true,
                    "feedly": false,            // Not yet implemented
                    "theoldreader": true,
                    "aolreader": false,         // Not yet implemented
                    "tinytinyrss": false,       // Not yet implemented
                    "wallabag": false           // Not yet implemented
                }
            }
        }
    }
    
    var liveValues = {
        "platform": (typeof process != 'undefined' && process.platform) || (typeof cordova != 'undefined' && cordova.platformId) || "",
        "timestamps": {
            "min": -1,                          // Timestamp value beyond which an entry can't be displayed (Too old). Set by function "_setTimestamps()"
            "max": -1                           // End of current day (23:59:59). Set by function "_setTimestamps()"
        },
        "entries": {
            "id": {
                "min": -1,                      // Set by function "setEntriesIds"
                "max": -1                       // Set by function "setEntriesIds"
                                                // Depends of: 
                                                // - params.entries.dontDisplayEntriesOlderThan
                                                // - my.isSmallEntry()
                                                // - search keyword value
            },
            "search": {
                "visible": false                // Set if form "search entries by keyword" is visible or not
            },
            "imagesPreviouslyDisplayed": [],    // Store images previously displayed. 
                                                // Used for displaying images in offline mode.
            "newsPreviouslyDisplayed": [],      // Store news previously displayed.
                                                // Used to change entries opacity.
            "html": [],
            "last": "",                         // Store last recent entry.
            "currentlyDisplayed": ""            // Store id (tsms) of news currently displayed. Required to set "partialRendering" value.
                                                // User is reading a news.
        },
        "sync": {                               // Store informations about last synchro
            "inProgress": false,
            "nbFeedsLoaded": 0,                 // Used during synchro
            "nbFeedsToLoad": 0,                 // Used during synchro
            "nbDaysAgo": -1,
            "theme": "",
            "timestamps": {
                "max": -1,
                "lastUpdate": 0                 // Timestamp in seconds of last synchro
            },
            "selectedFeed": {                   // (See also "params.feeds.selectedFeed")
                "url": "",
                "account": ""                
            }
        },
        "screens": {
            "feedsList": {
                "opened": false                 // Slide right or left entries screen
            },
            "entries": {
                "scrollPosition": 0
            }
        },
        "animations": {
            "inProgress": false                 // Set to "true" when user click on elements with "_startAnimation_" class.
        },
        "swipe": {
            "inProgress": false                 // Set to "true". Permit to increase UI performances when user is doing a swipe.
        },
        "network": {
            "status": 'NA'
        }, 
        "login": {
            "inProgress": {
                "local": false, 
                "feedly": false, 
                "theoldreader": false, 
                "aolreader": false, 
                "tinytinyrss": false,
                "wallabag": false
            }
        },
        "timeouts": {                           // Javascript timeouts
            "entries": {
                "display": ""
            }
        }
    }
    
    var keywords = [];

    var _previousNbDaysAgo = -1;

    // Load params from SDCard.
    // Create file if doesn't exists.

    my._load('params.json').then(function(_myParams) {
        my.log('loading params from file params.json ...', _myParams);

        if (params.version > _myParams.version) {

            for (var _account in myFeedsSubscriptions) {
                if (typeof _myParams.accounts[_account] !== 'undefined') {
                    params.accounts[_account] = _myParams.accounts[_account]; // Keep user account parameters if exists
                }
            }
            
            _save('params');
        } else {
            params = _myParams;
        }
        
        ui.selectThemeIcon();
        
        // Set language
        
        if (params.settings.ui.language != "") {
            userLocale = params.settings.ui.language;
            document.webL10n.setLanguage(params.settings.ui.language, "");
        }
        
        // Get and set Feedly token from cache 
        // then try to update token
        // then try to update subscriptions.
        
        if (params.accounts.feedly.logged) {
            my._load('cache/feedly/access_token.json').then(function(_token){
            
                feedly.setToken(_token);
                
                var _now = Math.floor(new Date().getTime() / 1000);
                var _expires_in = _token.expires_in || 604800;
                var _tokenIsExpired = ((_now - _token.lastModified) > _expires_in) ? true : false;
                
                if ((liveValues.network.status != 'online') && (_tokenIsExpired)) {
                    _disableAccount('feedly');
                }
                    
                if (liveValues.network.status == 'online') {
                    if (_tokenIsExpired) {
                        feedly.updateToken().catch(function(error) {
                            _disableAccount('feedly');
                        }).then(function(){
                            if (params.accounts.feedly.logged) {
                                feedly.getSubscriptions();
                            }
                        });
                    } else {
                        feedly.getSubscriptions();
                    }
                }
                
            }).catch(function(error) {
                _disableAccount('feedly');
                my.alert(document.webL10n.get("i-cant-reconnect-your-account", {"online-account": "Feedly"}));
            });
        }
        
        // Get and set The Old Reader server URL from cache 
        // Get end set The Old Reader token (session_id) from cache
        // then try to update token (session_id)
        // then try to update subscriptions

        my._load("cache/theoldreader/params.json").then(function(response){
            theoldreader.theoldreader.email = response.email;
            theoldreader.theoldreader.password = response.password;
        }).catch(function(error){
            //theoldreader.theoldreader.url = '';
        }).then(function(){return my._load('cache/theoldreader/access_token.json');}).then(function(_token){
            
            if (params.accounts.theoldreader.logged) {
                theoldreader.setToken(_token);
                
                var _now = Math.floor(new Date().getTime() / 1000);
                var _expires_in = _token.expires_in || 604800;
                var _tokenIsExpired = ((_now - _token.lastModified) > _expires_in) ? true : false;
                
                if ((liveValues.network.status != 'online') && (_tokenIsExpired)) {
                    _disableAccount('theoldreader');
                }
                    
                if (liveValues.network.status == 'online') {
                    if (_tokenIsExpired) {
                        theoldreader.updateToken().catch(function(error) {
                            _disableAccount('theoldreader');
                        }).then(function(){
                            if (params.accounts.theoldreader.logged) {
                                theoldreader.getSubscriptions();
                            }
                        });
                    } else {
                        theoldreader.getSubscriptions();
                    }
                }
            }
            
        }).catch(function(error) {
            _disableAccount('theoldreader');
            my.alert(document.webL10n.get("i-cant-reconnect-your-account", {"online-account": "The Old Reader"}));
        });
        
        // Get and set Aol Reader token from cache
        // then try to update token
        // then try to update subscriptions.
        
        if (params.accounts.aolreader.logged) {
            my._load('cache/aolreader/access_token.json').then(function(_token){
            
                aolreader.setToken(_token);
                
                var _now = Math.floor(new Date().getTime() / 1000);
                var _expires_in = _token.expires_in || 604800;
                var _tokenIsExpired = ((_now - _token.lastModified) > _expires_in) ? true : false;
                
                if ((liveValues.network.status != 'online') && (_tokenIsExpired)) {
                    _disableAccount('aolreader');
                }
                    
                if (liveValues.network.status == 'online') {
                    if (_tokenIsExpired) {
                        aolreader.updateToken().catch(function(error) {
                            _disableAccount('aolreader');
                        }).then(function(){
                            if (params.accounts.aolreader.logged) {
                                aolreader.getSubscriptions();
                            }
                        });
                    } else {
                        aolreader.getSubscriptions();
                    }
                }
                
            }).catch(function(error) {
                _disableAccount('aolreader');
                my.alert(document.webL10n.get("i-cant-reconnect-your-account", {"online-account": "Aol Reader"}));
            });
        }
        
        // Get and set Tiny Tiny Rss server URL from cache 
        // Get end set Tiny Tiny Rss token (session_id) from cache
        // then try to update token (session_id)
        // then try to update subscriptions

        my._load("cache/tinytinyrss/params.json").then(function(response){
            tinytinyrss.tinytinyrss.url = response.url;
            tinytinyrss.tinytinyrss.user = response.user;
            tinytinyrss.tinytinyrss.password = response.password;
        }).catch(function(error){
            tinytinyrss.tinytinyrss.url = '';
        }).then(function(){return my._load('cache/tinytinyrss/access_token.json');}).then(function(_token){
            
            if (params.accounts.tinytinyrss.logged) {
                tinytinyrss.setToken(_token);
                
                var _now = Math.floor(new Date().getTime() / 1000);
                var _expires_in = _token.expires_in || 604800;
                var _tokenIsExpired = ((_now - _token.lastModified) > _expires_in) ? true : false;
                
                if ((liveValues.network.status != 'online') && (_tokenIsExpired)) {
                    _disableAccount('tinytinyrss');
                }
                    
                if (liveValues.network.status == 'online') {
                    if (_tokenIsExpired) {
                        tinytinyrss.updateToken().catch(function(error) {
                            _disableAccount('tinytinyrss');
                        }).then(function(){
                            if (params.accounts.tinytinyrss.logged) {
                                tinytinyrss.getSubscriptions();
                            }
                        });
                    } else {
                        tinytinyrss.getSubscriptions();
                    }
                }
            }
            
        }).catch(function(error) {
            _disableAccount('tinytinyrss');
            my.alert(document.webL10n.get("i-cant-reconnect-your-account", {"online-account": "Tiny Tiny Rss"}));
        });
        
        // Get and set Wallabag parameters from cache 
        // Get end set Wallabag token (session_id) from cache
        // then try to update token (session_id)
        // then try to update subscriptions
        
        my._load("cache/wallabag/params.json").then(function(response){
            my.log(response);
            wallabag.wallabag.url = response.url;
            wallabag.wallabag.client_id = response.client_id;
            wallabag.wallabag.client_secret = response.client_secret;
            wallabag.wallabag.user = response.user;
            wallabag.wallabag.password = response.password;
        }).catch(function(error){
            //wallabag.wallabag.url = '';
        }).then(function(){return my._load('cache/wallabag/access_token.json');}).then(function(_token){
            
            if (params.accounts.wallabag.logged) {
                wallabag.setToken(_token);
                
                var _now = Math.floor(new Date().getTime() / 1000);
                var _expires_in = _token.expires_in || 604800;
                var _tokenIsExpired = ((_now - _token.lastModified) > _expires_in) ? true : false;
                
                if ((liveValues.network.status != 'online') && (_tokenIsExpired)) {
                    _disableAccount('wallabag');
                }
                    
                if (liveValues.network.status == 'online') {
                    if (_tokenIsExpired) {
                        wallabag.updateToken().catch(function(error) {
                            _disableAccount('wallabag');
                        }).then(function(){
                            if (params.accounts.wallabag.logged) {
                                wallabag.getSubscriptions();
                            }
                        });
                    } else {
                        wallabag.getSubscriptions();
                    }
                }
            }
            
        }).catch(function(error) {
            _disableAccount('wallabag');
            my.alert(document.webL10n.get("i-cant-reconnect-your-account", {"online-account": "Wallabag"}));
        });

        // ---
        
    }).catch(function(error) {
        _save('params');
    });

    // Load keywords from SDCard.
    // Create file if doesn't exists.

    my._load('keywords.json').then(function(_myKeywords) {
        my.log('loading keywords from file keywords.json ...', _myKeywords);
        keywords = _myKeywords;
    }).catch(function(error) {
        _save('keywords');
    });

    // ---

    var sortedEntries = [];
    var sortedFeeds = [];

    // =================
    // --- Functions ---
    // =================
   
    function deleteKeyword(_this) {
        my.log('deleteKeyword() ', arguments);

        var _myKeyword = _this.getAttribute("myKeyword");

        var _confirm = window.confirm(document.webL10n.get('confirm-delete-keyword') + "\n" + _myKeyword);

        if (_confirm) {
            
            ui.fade(_this);

            var _tmp = [];

            // (0) If user is deleting current selected keyword
                
            if (_myKeyword == params.feeds.selectedKeyword.value) {
                params.feeds.selectedKeyword.value = "";
                params.feeds.selectedKeyword.domId = "";
            }

            // (1) Delete myKeyword from array "keyword"

            for (var i = 0; i < keywords.length; i++) {
                if (keywords[i] != _myKeyword) {
                    _tmp.push(keywords[i]);
                }
            }

            keywords = _tmp.slice();
            
            _save('keywords');

            // (2) Reload UI

            if ((myFeedsSubscriptions.local.length > 0) ||
                (myFeedsSubscriptions.feedly.length > 0) ||
                (myFeedsSubscriptions.theoldreader.length > 0) || 
                (myFeedsSubscriptions.aolreader.length > 0) ||
                (myFeedsSubscriptions.tinytinyrss.length > 0)
            ){
                loadFeeds();
            } else {
                ui.echo("feeds-list", "", "");
                ui.echo("feeds-entries-content", "", "");
                ui._onclick(sync, 'disable');
            }
        }
    }

    function deleteFeed(_this) {
        my.log('deleteFeed() ', arguments);

        var _feedId = _this.getAttribute("feedId");
        var _account = _this.getAttribute("account");
        var _confirm = window.confirm(_account + ' : ' + document.webL10n.get('confirm-delete-feed') + "\n" + _feedId);

        if (_confirm) {

            var _tmp = [];

            ui.fade(_this);

            // (1) Delete feedId from array "myFeedsSubscriptions[_account]"

            for (var i = 0; i < myFeedsSubscriptions[_account].length; i++) {
                if (myFeedsSubscriptions[_account][i].id != _feedId) {
                    //delete myFeedsSubscriptions.local[i];
                    _tmp.push(myFeedsSubscriptions[_account][i]);
                    //break;
                }
            }

            myFeedsSubscriptions[_account] = _tmp.slice();

            // (3a) Delete from Local
            
            if (_account == 'local') {
                my._save("subscriptions." + _account + ".json", "application/json", JSON.stringify(myFeedsSubscriptions.local)).then(function(results) {
                    my.message(document.webL10n.get('feed-has-been-deleted'));
                }).catch(function(error) {
                    my.error("ERROR saving file ", error);
                    my.alert("ERROR saving file " + error.filename);
                });
            }

            // (3b) Delete from Feedly

            if (_account == 'feedly') {
                feedly.deleteSubscription(_feedId).then(function(response){
                    my.message(document.webL10n.get('feed-has-been-deleted'));
                    my._save("subscriptions." + _account + ".json", "application/json", JSON.stringify(myFeedsSubscriptions[_account])).then(function(results) {
                        my.log('Save subscriptions.' + _account + '.json');
                    }).catch(function(error) {
                        my.error("ERROR saving file ", error);
                        my.alert("ERROR saving file " + error.filename);
                    });
                }).catch(function(error) {
                    my._save("subscriptions." + _account + ".json", "application/json", JSON.stringify(myFeedsSubscriptions[_account])).then(function(results) {
                        my.log('Save subscriptions.' + _account + '.json');
                    }).catch(function(error) {});
                    my.message(document.webL10n.get('error-cant-delete-this-feed'));
                    my.error(error);
                });
            }

            // (3c) Delete from TheOldReader

            if (_account == 'theoldreader') {
                theoldreader.deleteSubscription(_feedId).then(function(response){
                    my.message(document.webL10n.get('feed-has-been-deleted'));
                    my._save("subscriptions." + _account + ".json", "application/json", JSON.stringify(myFeedsSubscriptions[_account])).then(function(results) {
                        my.log('Save subscriptions.' + _account + '.json');
                    }).catch(function(error) {
                        my.error("ERROR saving file ", error);
                        my.alert("ERROR saving file " + error.filename);
                    });
                }).catch(function(error) {
                    my._save("subscriptions." + _account + ".json", "application/json", JSON.stringify(myFeedsSubscriptions[_account])).then(function(results) {
                        my.log('Save subscriptions.' + _account + '.json');
                    }).catch(function(error) {});
                    my.message(document.webL10n.get('error-cant-delete-this-feed'));
                    my.error(error);
                });
            }
            
            // (3d) Delete from AolReader

            if (_account == 'aolreader') {
                aolreader.deleteSubscription(_feedId).then(function(response){
                    my.message(document.webL10n.get('feed-has-been-deleted'));
                    my._save("subscriptions." + _account + ".json", "application/json", JSON.stringify(myFeedsSubscriptions[_account])).then(function(results) {
                        my.log('Save subscriptions.' + _account + '.json');
                    }).catch(function(error) {
                        my.error("ERROR saving file ", error);
                        my.alert("ERROR saving file " + error.filename);
                    });
                }).catch(function(error) {
                    my._save("subscriptions." + _account + ".json", "application/json", JSON.stringify(myFeedsSubscriptions[_account])).then(function(results) {
                        my.log('Save subscriptions.' + _account + '.json');
                    }).catch(function(error) {});
                    my.message(document.webL10n.get('error-cant-delete-this-feed'));
                    my.error(error);
                });
            }
            
            // (3e) Delete from Tiny Tiny Rss

            if (_account == 'tinytinyrss') {
                tinytinyrss.deleteSubscription(_feedId).then(function(response){
                    my.message(document.webL10n.get('feed-has-been-deleted'));
                    my._save("subscriptions." + _account + ".json", "application/json", JSON.stringify(myFeedsSubscriptions[_account])).then(function(results) {
                        my.log('Save subscriptions.' + _account + '.json');
                    }).catch(function(error) {
                        my.error("ERROR saving file ", error);
                        my.alert("ERROR saving file " + error.filename);
                    });
                }).catch(function(error) {
                    my._save("subscriptions." + _account + ".json", "application/json", JSON.stringify(myFeedsSubscriptions[_account])).then(function(results) {
                        my.log('Save subscriptions.' + _account + '.json');
                    }).catch(function(error) {});
                    my.message(document.webL10n.get('error-cant-delete-this-feed'));
                    my.error(error);
                });
            }

            // (4) Delete entries
            
            sp.deleteEntries(_account, _feedId);

            // (5) Reload UI

            if ((myFeedsSubscriptions.local.length > 0) ||
                (myFeedsSubscriptions.feedly.length > 0) ||
                (myFeedsSubscriptions.theoldreader.length > 0) || 
                (myFeedsSubscriptions.aolreader.length > 0) ||
                (myFeedsSubscriptions.tinytinyrss.length > 0) 
            ){
                sp.setFeedsSubscriptions(myFeedsSubscriptions);
                loadFeeds();
            } else {
                ui.echo("feeds-list", "", "");
                ui.echo("feeds-entries-content", "", "");
                ui._onclick(sync, 'disable');
            }
        }
    }

    function findFeedsDisplayResults(event) {
        my.log('findFeedsDisplayResults()', arguments);
        my.log(event);

        if ((typeof event.detail.feedUrl !== 'null') && (event.detail.entries.length > 0)) {
            var _htmlResults = "<ul>";

            // Is feed already in subscriptions ?

            var _feedAlreadySubscribed = false;

            for (var _account in myFeedsSubscriptions) {
                for (var j = 0; j < myFeedsSubscriptions[_account].length; j++) {
                    if (event.detail.feedUrl == myFeedsSubscriptions[_account][j]["url"]) {
                        _feedAlreadySubscribed = true;
                        break;
                    }
                }
            }

            // ---

            if (!_feedAlreadySubscribed) {
                _htmlResults = _htmlResults + '<li><a><button class="addNewFeed" feedUrl="' + event.detail.feedUrl + '" feedId="' + event.detail.url + '" ><span data-icon="add"></span></button><p>' + event.detail.title + '</p><p><time>' + event.detail.feedUrl + '</time></p></a></li>';
            } else {
                _htmlResults = _htmlResults + '<li><a><button class="cantAddNewFeed warning"><span class="fa fa-ban fa-2x"></span></button><p>' + event.detail.title + '</p><p><time>' + event.detail.feedUrl + '</time></p><p class="warning">' + document.webL10n.get('feed-already-subscribed') + '</p></a></li>';
            }

            _htmlResults = _htmlResults + "</ul>";

            ui.echo("find-feeds", _htmlResults, "");

            // ==================
            // --- Add Events ---
            // ==================

            // onclick add button :

            var _adds = document.querySelectorAll(".addNewFeed");

            for (var i = 0; i < _adds.length; i++) {
                _adds[i].onclick = function() { 
                    ui._vibrate();
                    findFeedsAddNewFeed(this);
                }
            }
        } else if (event.detail.entries.length == 0) {
            ui.echo("find-feeds", document.webL10n.get('find-feeds-no-results'), "");
        } else {
            ui.echo("find-feeds", "Find feeds : Network error", "prepend");
        }
    }

    function findFeedsAddNewFeed(_this) {
        my.log('findFeedsAddNewFeed() ', arguments);

        var _feedUrl = _this.getAttribute("feedUrl");
        var _feedId  = _this.getAttribute("feedId");
        var _confirm = window.confirm(document.webL10n.get('confirm-add-feed'));

        if (_confirm) {

            var _myNewFeed = {"url": _feedUrl, "pulsations": params['feeds']['defaultPulsations'], "account": "local", "id": _feedId};
            var _myNewFeed = {"url": _feedUrl, "pulsations": params['feeds']['defaultPulsations'], "account": "local", "id": _feedUrl};

            // (1) Add feedUrl to array "myFeedsSubscriptions.local"

            myFeedsSubscriptions.local.push(_myNewFeed);

            // (2) Reload UI

            sp.setFeedsSubscriptions(myFeedsSubscriptions);
            loadFeeds();
            
            // (3) Save subscriptions.local.json
            
            my._save("subscriptions.local.json", "application/json", JSON.stringify(myFeedsSubscriptions.local)).then(function(results) {
                ui.echo("find-feeds", "", "");
                my.message(document.webL10n.get('feed-subscription-was-added'));
            }).catch(function(error) {
                my.error("ERROR saving file ", error);
                my.alert("ERROR saving file " + error.filename);
            });
        }
    }

    function dspSettings() {
        var start = performance.now();
        
        var _now = new Date();
        
        // Vibrate on click
        
        if (params.settings.ui.vibrate) {
            _vibrateOnClick = 'checked=""';
        } else {
            _vibrateOnClick = "";
        }

        // Count entries selector

        _displayCountEntriesChecked = (params.feeds.count) ? 'checked=""' : "";

        // Small entries selector

        if (params.entries.displaySmallEntries) {
            _displaySmallEntriesChecked = 'checked=""';
        } else {
            _displaySmallEntriesChecked = "";
        }

        // Feedly selector

        if (params.accounts.feedly.logged) {
            _feedlyAccount = 'checked=""';
        } else {
            _feedlyAccount = "";
        }

        // The Old Reader selector

        if (params.accounts.theoldreader.logged) {
            _theoldreaderAccount = 'checked=""';
        } else {
            _theoldreaderAccount = "";
        }
        
        // Aol Reader selector

        if (params.accounts.aolreader.logged) {
            _aolreaderAccount = 'checked=""';
        } else {
            _aolreaderAccount = "";
        }

        // Tiny Tiny Rss selector

        if (params.accounts.tinytinyrss.logged) {
            _tinytinyrssAccount = 'checked=""';
        } else {
            _tinytinyrssAccount = "";
        }
        
        // Wallabag selector

        if (params.accounts.wallabag.logged) {
            _wallabagAccount = 'checked=""';
        } else {
            _wallabagAccount = "";
        }

        // Use animations selector

        if (params.settings.ui.animations) {
            _useAnimations = 'checked=""';
        } else {
            _useAnimations = "";
        }
        
        // Logs console selector

        params.settings.developper_menu.logs.console ?
            _logsConsole = 'checked=""':
            _logsConsole = "";
            
        // Logs screen selector

        params.settings.developper_menu.logs.screen ?
            _logsScreen = 'checked=""':
            _logsScreen = "";

        // Proxy selector

        params.settings.proxy.use ?
            _useProxy = 'checked=""':
            _useProxy = "";

        // Update every

        var _every = params.settings.update.every;
        var _htmlSelectUpdateEvery = "";
        var _selected = "";

        _htmlSelectUpdateEvery = _htmlSelectUpdateEvery + '<select id="selectUpdateEvery">';

        for (var i = 0; i < _every.length; i++) {
            if (params.entries.updateEvery == _every[i]) {
                _selected = "selected";
            } else {
                _selected = "";
            }
            _htmlSelectUpdateEvery = _htmlSelectUpdateEvery + '<option value="' + _every[i] + '" ' + _selected + ' >' + Math.floor(_every[i] / 60) + 'min</option>';
        }

        _htmlSelectUpdateEvery = _htmlSelectUpdateEvery + '</select>';
        
        // Base service

        var _servers = sp.getServers();
        var _serverId = sp.getServerId();
        var _htmlSelectServiceBase = "";
        var _selected = "";

        _htmlSelectServiceBase = _htmlSelectServiceBase + '<select id="selectServiceBase">';

        for (var i = 0; i < _servers.length; i++) {
            if (_serverId == _servers[i].id) {
                _selected = "selected";
            } else {
                _selected = "";
            }
            _htmlSelectServiceBase = _htmlSelectServiceBase + '<option value="' + _servers[i].id + '" ' + _selected + ' >' + _servers[i].name + '</option>';
        }

        _htmlSelectServiceBase = _htmlSelectServiceBase + '</select>';

        // Select max nb Days

        var _days = params.settings.days;
        var _htmlMaxNbDays = "";
        var _selected = "";

        _htmlMaxNbDays = _htmlMaxNbDays + '<select id="selectMaxNbDays">';

        for (var i = 0; i < _days.length; i++) {
            if (params.entries.dontDisplayEntriesOlderThan == _days[i]) {
                _selected = "selected";
            } else {
                _selected = "";
            }
            _htmlMaxNbDays = _htmlMaxNbDays + '<option value="' + _days[i] + '" ' + _selected + ' >' + _days[i] + '</option>';
        }

        _htmlMaxNbDays = _htmlMaxNbDays + '</select>';
        
        // Select language

        var _htmlLanguages = "";
        var _selected = "";

        _htmlLanguages = _htmlLanguages + '<select id="selectLanguage">';

        for (var _locale in myManifest['locales']) {
            if (params.settings.ui.language == _locale) {
                _selected = "selected";
            } else {
                _selected = "";
            }
            _htmlLanguages = _htmlLanguages + '<option value="' + _locale + '" ' + _selected + ' >' + myManifest['locales'][_locale]['my_title'] + '</option>';
        }

        _htmlLanguages = _htmlLanguages + '</select>';

        // ---

        var _htmlSettings = [
        '<h2 data-l10n-id="settings-feeds">' + document.webL10n.get('settings-feeds') + '</h2>',
        '<section data-type="list">',
        '<ul>',
        
        '   <li class="_online_" id="lastUpdate">',
        '       <aside class="icon"><span data-icon="reload"></span></aside>',
        '       <aside class="pack-end"><p class="double" id="lastUpdateTime">' + _now.toLocaleTimeString(userLocale) + '</p></aside>',
        '       <a href="#"><p class="double"><my data-l10n-id="settings-last-update">' + document.webL10n.get('settings-last-update') + '</my></p></a>',
        '   </li>',

        '   <li class="_online_">',
        '       <aside class="icon"><span data-icon="sync"></span></aside>',
        '       <a>',
        '           <p class="double"><my data-l10n-id="settings-update-every">' + document.webL10n.get('settings-update-every') + '</my></p>',
        '       </a>',
        '       ' + _htmlSelectUpdateEvery,
        '   </li>',

        '</ul>',
        '</section>',
        
        '<h2 data-l10n-id="settings-news">' + document.webL10n.get('settings-news') + '</h2>',
        '<section data-type="list">',
        '<ul>',
 
        '   <li>',
        '       <aside class="icon"><span data-icon="messages"></span></aside>',
        '       <aside class="pack-end"><label class="pack-switch"><input id="toggleCountEntries" type="checkbox"' + _displayCountEntriesChecked + '><span></span></label></aside>',
        '       <a href="#">',
        '           <p class="double"><my data-l10n-id="settings-feeds-count">' + document.webL10n.get('settings-feeds-count') + '</my></p>',
        '       </a>',
        '   </li>',
       
        '   <li>',
        '       <aside class="icon"><span data-icon="messages"></span></aside>',
        '       <aside class="pack-end"><label class="pack-switch"><input id="toggleDisplaySmallEntries" type="checkbox"' + _displaySmallEntriesChecked + '><span></span></label></aside>',
        '       <a href="#">',
        '           <p class="double"><my data-l10n-id="settings-small-news">' + document.webL10n.get('settings-small-news') + '</my></p>',
        '       </a>',
        '   </li>',

        '   <li>',
        '       <aside class="icon"><span data-icon="time"></span></aside>',
        '       <a>',
        '           <p class="double"><my data-l10n-id="settings-number-of-days">' + document.webL10n.get('settings-number-of-days') + '</my></p>',
        '       </a>',
        '       ' + _htmlMaxNbDays,
        '   </li>',
        
        '</ul>',
        '</section>',
        
        '<h2 data-l10n-id="settings-online-accounts">' + document.webL10n.get('settings-online-accounts') + '</h2>',
        '<section data-type="list">',
        '<ul class="feedly theoldreader aolreader">',
        
        '   <li class="_online_ _onlineAccount_ ' + (params.settings.proxy.availability.aolreader ? '' : '_proxyNotAvailable_') + '">',
        '       <aside class="icon"><span data-icon="addons"></span></aside>',
        '       <aside class="pack-end"><label class="pack-switch"><input id="aolreaderLogin" type="checkbox"' + _aolreaderAccount + '><span></span></label></aside>',
        '       <a href="#">',
        '           <p class="double">Aol Reader</p>',
        '       </a>',
        '   </li>',

        '   <li class="_online_ _onlineAccount_ ' + (params.settings.proxy.availability.feedly ? '' : '_proxyNotAvailable_') + '">',
        '       <aside class="icon"><span data-icon="addons"></span></aside>',
        '       <aside class="pack-end"><label class="pack-switch"><input id="feedlyLogin" type="checkbox"' + _feedlyAccount + '><span></span></label></aside>',
        '       <a href="#">',
        '           <p class="double">Feedly</p>',
        '       </a>',
        '   </li>',

        '   <li class="_online_ _onlineAccount_ ' + (params.settings.proxy.availability.theoldreader ? '' : '_proxyNotAvailable_') + '">',
        '       <aside class="icon"><span data-icon="addons"></span></aside>',
        '       <aside class="pack-end"><label class="pack-switch"><input id="theoldreaderCheckbox" type="checkbox"' + _theoldreaderAccount + '><span></span></label></aside>',
        '       <a href="#">',
        '           <p class="double">The Old Reader</p>',
        '       </a>',
        '       <div id="theoldreaderForm">',
        '           <p><input id="theoldreaderEmail" required="" placeholder="Email" name="theoldreaderEmail" type="email" value="' + theoldreader.theoldreader.email + '"></p>',
        '           <p><input id="theoldreaderPasswd" required="" placeholder="Password" name="theoldreaderPasswd" type="password" value="' + theoldreader.theoldreader.password + '"><p>',
        '       </div>',
        '   </li>',
 
        '   <li class="_online_ _onlineAccount_ ' + (params.settings.proxy.availability.tinytinyrss ? '' : '_proxyNotAvailable_') + '">',
        '       <aside class="icon"><span data-icon="addons"></span></aside>',
        '       <aside class="pack-end"><label class="pack-switch"><input id="tinytinyrssCheckbox" type="checkbox"' + _tinytinyrssAccount + '><span></span></label></aside>',
        '       <a href="#">',
        '           <p class="double">Tiny Tiny Rss</p>',
        '       </a>',
        '       <div id="tinytinyrssForm">',
        '           <p><input id="tinytinyrssUrl" required="" placeholder="Url" name="tinytinyrssUrl" type="text" value="' + tinytinyrss.tinytinyrss.url + '"></p>',
        '           <p><input id="tinytinyrssUser" required="" placeholder="Login" name="tinytinyrssUser" type="text" value="' + tinytinyrss.tinytinyrss.user + '"></p>',
        '           <p><input id="tinytinyrssPasswd" required="" placeholder="Password" name="tinytinyrssPasswd" type="password" value="' + tinytinyrss.tinytinyrss.password + '"><p>',
        '       </div>',
        '   </li>',
        
        '</ul>',
        '</section>',
   
        '<h2 data-l10n-id="additional-services">' + document.webL10n.get('additional-services') + '</h2>',
        '<section data-type="list">',
        '<ul>',
        
        '   <li class="_online_ _onlineAccount_ ' + (params.settings.proxy.availability.wallabag ? '' : '_proxyNotAvailable_') + '">',
        '       <aside class="icon"><span data-icon="addons"></span></aside>',
        '       <aside class="pack-end"><label class="pack-switch"><input id="wallabagCheckbox" type="checkbox"' + _wallabagAccount + '><span></span></label></aside>',
        '       <a href="#">',
        '           <p class="double">Wallabag</p>',
        '       </a>',
        '       <div id="wallabagForm">',
        '           <p><input id="wallabagUrl" required="" placeholder="Url" name="wallabagUrl" type="text" value="' + wallabag.wallabag.url + '"></p>',
        '           <p><input id="wallabagUser" required="" placeholder="Login" name="wallabagUser" type="text" value="' + wallabag.wallabag.user + '"></p>',
        '           <p><input id="wallabagPasswd" required="" placeholder="Password" name="wallabagPasswd" type="password" value="' + wallabag.wallabag.password + '"><p>',
        '           <p><input id="wallabagClientId" required="" placeholder="API Client ID" name="wallabagClientId" type="text" value="' + wallabag.wallabag.client_id + '"></p>',
        '           <p><input id="wallabagClientSecret" required="" placeholder="API Client Secret" name="wallabagClientSecret" type="text" value="' + wallabag.wallabag.client_secret + '"><p>',
        '           <p class="text"><my data-l10n-id="wallabag-help">' + document.webL10n.get('wallabag-help') + '</my></p>',
        '       </div>',
        '   </li>',
        
        '</ul>',
        '</section>',
             
        '<h2 data-l10n-id="user-interface">' + document.webL10n.get('user-interface') + '</h2>',
        '<section data-type="list">',
        '<ul>',
        
        '   <li>',
        '       <aside class="icon"><span data-icon222="play-circle" class="fa fa-play-circle fa-2x"></span></aside>',
        '       <aside class="pack-end"><label class="pack-switch"><input id="useAnimations" type="checkbox" ' + _useAnimations + '><span></span></label></aside>',
        '       <a href="#">',
        '           <p class="double"><my data-l10n-id="settings-use-animations">' + document.webL10n.get('settings-use-animations') + '</my></p>',
        '       </a>',
        '   </li>',
        
        '   <li>',
        '       <aside class="icon"><span data-icon="vibrate"></span></aside>',
        '       <aside class="pack-end"><label class="pack-switch"><input id="toggleVibrate" type="checkbox"' + _vibrateOnClick + '><span></span></label></aside>',
        '       <a href="#">',
        '           <p class="double"><my data-l10n-id="vibrate-on-click">' + document.webL10n.get('vibrate-on-click') + '</my></p>',
        '       </a>',
        '   </li>',

        '   <li>',
        '       <aside class="icon"><span data-icon="languages"></span></aside>',
        '       <a>',
        '           <p class="double"><my data-l10n-id="settings-ui-language">' + document.webL10n.get('settings-ui-language') + '</my></p>',
        '       </a>',
        '       ' + _htmlLanguages,
        '   </li>',
        
        '</ul>',
        '</section>',
        
        '<h2 data-l10n-id="about">' + document.webL10n.get('about') + '</h2>',
        '<section data-type="list">',
        '<ul>',

        '   <li id="appVersion">',
        '       <aside class="icon"><span data-icon222="wifi-4" class="fa fa-wifi fa-2x"></span></aside>',
        '       <aside class="pack-end"><p class="double">' + myManifest.version + '</p></aside>',
        '       <a href="#"><p class="double"><my data-l10n-id="app-title">' + document.webL10n.get('app-title') + '</my></p></a>',
        '   </li>',
 
        '   <li>',
        '       <aside class="icon"><span data-icon="contacts"></span></aside>',
        '       <aside class="pack-end"><p class="double">' + myManifest.developer.name + '</p></aside>',
        '       <a href="#"><p class="double"><my data-l10n-id="author">' + document.webL10n.get('author') + '</my></p></a>',
        '   </li>',
 
        '   <li class="_online_">',
        '       <aside class="icon"><span data-icon="help"></span></aside>',
        '       <aside class="pack-end">',
        '           <a href="' + params.changelog + '" target="_blank">',
        '               <p class="double"><button><span>www</span></button></p>',
        '           </a>',
        '       </aside>',
        '       <a href="' + params.changelog + '" target="_blank">',
        '           <p class="double"><my data-l10n-id="settings-release-notes">' + document.webL10n.get('settings-release-notes') + '</my></p>',
        '       </a>',
        '   </li>',
 
        '   <li class="about _online_">',
        '       <aside class="icon"><span data-icon="firefox"></span></aside>',
        '       <aside class="pack-end">',
        '           <a href="' + myManifest.developer.url + '" target="_blank">',
        '               <p class="double"><button><span>www</span></button></p>',
        '           </a>',
        '       </aside>',
        '       <a href="' + myManifest.developer.url + '" target="_blank">',
        '           <p class="double"><my data-l10n-id="website">' + document.webL10n.get('website') + '</my></p>',
                '</a>',
        '   </li>',
        
        '   <li class="about _online_">',
        '       <aside class="icon"><span data-icon="firefox"></span></aside>',
        '       <aside class="pack-end">',
        '           <a href="' + document.webL10n.get('git-url') + '" target="_blank">',
        '               <p class="double"><button><span>www</span></button></p>',
        '           </a>',
        '       </aside>',
        '       <a href="' + document.webL10n.get('git-url') + '" target="_blank">',
        '           <p class="double"><my data-l10n-id="git-repository">' + document.webL10n.get('git-repository') + '</my></p>',
        '       </a>',
        '   </li>',
 
        '   <li class="about _online_">',
        '       <aside class="icon"><span data-icon="languages"></span></aside>',
        '       <a href="#">',
        '           <p class="double"><my data-l10n-id="settings-translations">' + document.webL10n.get('settings-translations') + '</my></p>',
        '       </a>',
        '       <ul>',
        '           <li><a href="https://github.com/Sergio-Muriel" target="_blank">Sergio Muriel (es)</a></li>',
        '           <li><a href="https://github.com/evertton" target="_blank">Evertton de Lima (pt)</a></li>',
        '           <li><a>Пётр Жоря (ru)</a></li>',
        '       </ul>',
        '   </li>',

        '</ul>',
        '</section>',
        
        '<h2 class="developper-menu" data-l10n-id="settings-developper-menu">' + document.webL10n.get('settings-developper-menu') + '</h2>',
        '<section data-type="list">',
        '<ul class="developper-menu">',

        '   <li>',
        '       <aside class="icon"><span data-icon222="wifi-4" class="fa fa-wifi fa-2x"></span></aside>',
        '       <aside class="pack-end"><p class="double" id="onLine">' + liveValues.network.status + '</p></aside>',
        '       <a href="#"><p class="double"><my data-l10n-id="settings-connection">' + document.webL10n.get('settings-connection') + '</my></p></a>',
        '   </li>',

        '   <li class="_online_">',
        '       <aside class="icon"><span data-icon="addons"></span></aside>',
        '       <aside class="pack-end"><label class="pack-switch"><input id="useProxy" type="checkbox" ' + _useProxy + '><span></span></label></aside>',
        '       <a href="#">',
        '           <p><my data-l10n-id="settings-use-proxy">' + document.webL10n.get('settings-use-proxy') + '</my></p>',
        '           <p><my data-l10n-id="settings-proxy-not-available">' + document.webL10n.get('settings-proxy-not-available') + '</my></p>',
        '       </a>',
        '   </li>',

        '   <!-- li>',
        '       <aside class="icon"><span data-icon="sd-card"></span></aside>',
        '       <aside class="pack-end"><div><button id="loadSubscriptions"><span data-l10n-id="load">load</span></button></div></aside>',
        '       <a href="#"><p class="double"><my data-l10n-id="my-subscriptions">' + document.webL10n.get('my-subscriptions') + '</my></p></a>',
        '   </li -->',

        '   <li>',
        '       <aside class="icon"><span data-icon="bug"></span></aside>',
        '       <aside class="pack-end"><label class="pack-switch"><input id="logsConsole" type="checkbox"' + _logsConsole + '><span></span></label></aside>',
        '       <a href="#"><p class="double">Logs console</p></a>',
        '   </li>',

        '   <li>',
        '       <aside class="icon"><span data-icon="bug"></span></aside>',
        '       <aside class="pack-end"><label class="pack-switch"><input id="logsScreen" type="checkbox"' + _logsScreen + '><span></span></label></aside>',
        '       <a href="#"><p class="double">Logs screen</p></a>',
        '   </li>',
        
        '   <li class="_online_">',
        '       <aside class="icon"><span data-icon="addons"></span></aside>',
        '       <a>',
        '           <p class="double"><my data-l10n-id="settings-service-base">' + document.webL10n.get('settings-service-base') + '</my></p>',
        '       </a>',
        '       ' + _htmlSelectServiceBase,
        '   </li>',
        
        '</ul>',
        '</section>'
        ].join('');

        ui.echo("settings", _htmlSettings, "");
        
        // ==========================================
        // --- Enable / Disable online account(s) ---
        // ==========================================
        
        ui.toggleProxy(); // If proxy is in use, disable online account(s) who does not support proxy.

        // =======================================
        // --- Hide / show The old reader form ---
        // =======================================
        
        params.accounts.theoldreader.logged ?
            document.getElementById('theoldreaderForm').style.cssText = 'display: none':
            document.getElementById('theoldreaderForm').style.cssText = 'display: block';
 
        // ======================================
        // --- Hide / show Tiny Tiny Rss form ---
        // ======================================
        
        params.accounts.tinytinyrss.logged ?
            document.getElementById('tinytinyrssForm').style.cssText = 'display: none':
            document.getElementById('tinytinyrssForm').style.cssText = 'display: block';
            
        // =================================
        // --- Hide / show Wallabag form ---
        // =================================
        
        params.accounts.wallabag.logged ?
            document.getElementById('wallabagForm').style.cssText = 'display: none':
            document.getElementById('wallabagForm').style.cssText = 'display: block';
        
        // ============================
        // --- Show developper menu ---
        // ============================
        
        document.getElementById('appVersion').onclick = function(e) {
            params.settings.developper_menu.visible = !params.settings.developper_menu.visible;
            dspSettings();
            my.message('Developper menu : ' + params.settings.developper_menu.visible);
            _save('params');
        }
        
        // ============================
        // --- Show developper menu ---
        // ============================

        if (params.settings.developper_menu.visible == true) {
            var dm = document.getElementsByClassName("developper-menu");
            var i;
            for (i = 0; i < dm.length; i++) {
                dm[i].style.display = "block";
            }
        }

        // ==================
        // --- Add Events ---
        // ==================

        // --- Feeds ---

        var _selectUpdateEvery = document.getElementById('selectUpdateEvery');
        _selectUpdateEvery.onchange = function(e) {
            params.entries.updateEvery = _selectUpdateEvery.options[_selectUpdateEvery.selectedIndex].value;
            _save('params');
        }
 
        document.getElementById('toggleCountEntries').onclick = function(e) {
            params.feeds.count = !params.feeds.count;
            _save('params');
            dspFeeds(sp.getFeeds());
        }

        // --- News ---

        document.getElementById('toggleDisplaySmallEntries').onclick = function(e) {
            document.body.dispatchEvent(new CustomEvent('settingsSmallNews.change', {"detail": ""}));
            params.entries.displaySmallEntries = !params.entries.displaySmallEntries;
            _save('params');
            
            params.entries.displaySmallEntries ?
                ui._smallEntries('show') : ui._smallEntries('hide');
        }

        var _selectMaxNbDays = document.getElementById('selectMaxNbDays');
        _selectMaxNbDays.onchange = function(e) {
            params.entries.dontDisplayEntriesOlderThan = _selectMaxNbDays.options[_selectMaxNbDays.selectedIndex].value;
            
            if (params.entries.nbDaysAgo >= params.entries.dontDisplayEntriesOlderThan) {
                params.entries.nbDaysAgo = params.entries.dontDisplayEntriesOlderThan;
                ui._onclick(nextDay, 'enable');         // [<]
                ui._onclick(previousDay, 'disable');    // [>]
                dom['screens']['entries']['scroll'].scrollTop = 0;
                dspEntries();
            }
            
            if (params.entries.nbDaysAgo < params.entries.dontDisplayEntriesOlderThan) {
                ui._onclick(previousDay, 'enable');     // [>]
            }
            
            _save('params');
        }
 
        // --- Online accounts ---

        // Feedly checkbox

        document.getElementById('feedlyLogin').onclick = function() {
            if (this.checked) {
                this.checked = false; // False until CustomEvent Feedly.login.done
                feedly.login();
            } else {
                params.accounts.feedly.logged = false;
                _disableAccount('feedly');
                loadFeeds();
            }
        }

        // The Old Reader login checkbox

        document.getElementById('theoldreaderCheckbox').onclick = function() {
            if (this.checked) {
                this.checked = false; // False until CustomEvent TheOldReader.login.done
                var _email = document.getElementById("theoldreaderEmail").value;
                var _passwd = document.getElementById("theoldreaderPasswd").value;
                theoldreader.login(_email, _passwd);
            } else {
                params.accounts.theoldreader.logged = false;
                _disableAccount('theoldreader');
                loadFeeds();
                document.getElementById('theoldreaderForm').style.cssText = 'display: block';
            }
        }
        
        // Aol Reader checkbox
        
        document.getElementById('aolreaderLogin').onclick = function() {
            if (this.checked) {
                this.checked = false; // False until CustomEvent AolReader.login.done
                aolreader.login();
            } else {
                params.accounts.aolreader.logged = false;
                _disableAccount('aolreader');
                loadFeeds();
            }
        }
 
        // Tiny Tiny Rss login checkbox

        document.getElementById('tinytinyrssCheckbox').onclick = function() {
            if (this.checked) {
                this.checked = false; // False until CustomEvent TinyTinyRss.login.done
                var _url = document.getElementById("tinytinyrssUrl").value;
                var _user = document.getElementById("tinytinyrssUser").value;
                var _passwd = document.getElementById("tinytinyrssPasswd").value;
                tinytinyrss.login(_url, _user, _passwd);
            } else {
                params.accounts.tinytinyrss.logged = false;
                _disableAccount('tinytinyrss');
                loadFeeds();
                document.getElementById('tinytinyrssForm').style.cssText = 'display: block';
            }
        }
        
        // Wallabag login checkbox

        document.getElementById('wallabagCheckbox').onclick = function() {
            if (this.checked) {
                this.checked = false; // False until CustomEvent Wallabag.login.done
                var _url = document.getElementById("wallabagUrl").value;
                var _user = document.getElementById("wallabagUser").value;
                var _passwd = document.getElementById("wallabagPasswd").value;
                var _client_id = document.getElementById("wallabagClientId").value;
                var _client_secret = document.getElementById("wallabagClientSecret").value;
                wallabag.login(_url, _user, _passwd, _client_id, _client_secret);
            } else {
                params.accounts.wallabag.logged = false;
                _disableAccount('wallabag');
                //loadFeeds();
                document.getElementById('wallabagForm').style.cssText = 'display: block';
            }
        }
        
        // --- UI ---

        // UI animations checkbox

        document.getElementById("useAnimations").onclick = function() {
            params.settings.ui.animations = !params.settings.ui.animations;
            _save('params');
        }
 
        // UI vibrate

        document.getElementById("toggleVibrate").onclick = function() {
            params.settings.ui.vibrate = !params.settings.ui.vibrate;
            _save('params');
        }
        
        // UI select language

        var _selectLanguage = document.getElementById('selectLanguage');
        _selectLanguage.onchange = function(e) {
            params.settings.ui.language = _selectLanguage.options[_selectLanguage.selectedIndex].value;
            _save('params');
            document.webL10n.setLanguage(params.settings.ui.language, "");
            //loadFeeds();
        }
      
        // --- Developer menu ---
       
        // Load subscriptions
        
        /*document.getElementById("loadSubscriptions").onclick = function(event) {
            if (window.confirm(document.webL10n.get('confirm-load-subscriptions'))) {
                my._load('subscriptions.local.json').then(
                    function (_mySubscriptions) {
                        try{
                            myFeedsSubscriptions['local'] = [];
                            addNewSubscriptions(_mySubscriptions);
                            my.message(document.webL10n.get('loading-subscriptions-done'));
                        } catch (err) {
                            my.alert(err.message);
                        }
                        sp.setFeedsSubscriptions(myFeedsSubscriptions);
                        loadFeeds();
                    }
                ).catch(function(error) {
                    my.message(document.webL10n.get('error-cant-load-local-subscriptions') + JSON.stringify(error));
                });
            }
        }*/
 
        // Proxy checkbox

        document.getElementById("useProxy").onclick = function() {
            params.settings.proxy.use = !params.settings.proxy.use;
            _save('params');
            ui.toggleProxy();
        }
       
        // Logs console checkbox

        document.getElementById("logsConsole").onclick = function() {
            params.settings.developper_menu.logs.console = !params.settings.developper_menu.logs.console;
            _save('params');
        }
        
        // Logs console screen

        document.getElementById("logsScreen").onclick = function() {
            params.settings.developper_menu.logs.screen = !params.settings.developper_menu.logs.screen;
            _save('params');
        }
        
        // Service base

        var _selectServiceBase = document.getElementById('selectServiceBase');
        _selectServiceBase.onchange = function(e) {
            sp.setServerId(_selectServiceBase.options[_selectServiceBase.selectedIndex].value);
        }

        // =========================
        // --- App start offline ---
        // =========================
        
        if (liveValues.network.status != 'online') {
            ui._disable();
        }

        // ---

        var end = performance.now();
        my.log("dspSettings() " + (end - start) + " milliseconds.");
    }

    function setNbFeedsToLoad() {
        var _nbFeedsToLoad = 0;
        for (var _account in myFeedsSubscriptions) {
            if (params.accounts[_account].logged) {
                _nbFeedsToLoad = _nbFeedsToLoad + myFeedsSubscriptions[_account].length;
            }
        }
        liveValues.sync.nbFeedsToLoad = _nbFeedsToLoad;
    }

    function loadFeeds() {
        if (liveValues.sync.inProgress) {return;}

        liveValues.sync.inProgress = true;
        liveValues.sync.timestamps.lastUpdate = Math.round(Date.now()/1000);
        ui._onclick(sync, 'disable');
        
        try {
            var _now = new Date();
            document.getElementById('lastUpdateTime').innerHTML = _now.toLocaleTimeString(userLocale); 
        } catch (error) {}

        _setTimestamps();
        setNbFeedsToLoad();
        sp.loadFeeds(params.entries.dontDisplayEntriesOlderThan);
        _save('liveValues');
    }

    function dspFeeds(feeds) {
        var start = performance.now();
        
        my.log('dspFeeds()', feeds);
        my.log(feeds.length + ' feeds');

        var _html = {
            'local': '',
            'aolreader': '',
            'feedly': '',
            'theoldreader': '',
            'tinytinyrss': ''
        };
        var _htmlFeeds = "";
        var _htmlKeywords = '';
        var _feedlyAccessToken = feedly.getToken().access_token;
        var _theoldreaderAuth = theoldreader.getToken().Auth;
        var _aolreaderAccessToken = aolreader.getToken().access_token;
        var _tinytinyrssAuth = (params.accounts.tinytinyrss.logged == true && tinytinyrss.getToken().content !== undefined) ? tinytinyrss.getToken().content.session_id : undefined;
        // @todo: Why "content" above is sometimes undefined ?

        // ========================
        // --- Display keywords ---
        // ========================
        
        if (keywords.length > 0) {
            var _sortedKeywords = keywords.sort();
            
            _htmlKeywords = _htmlKeywords + '<h2 data-l10n-id="search-by-keywords">' + document.webL10n.get('search-by-keywords') + '</h2><ul id="keywords" class="keywords">';
            
            for (var i = 0; i < _sortedKeywords.length; i++) {
                var _iconPulsations = (params.feeds.count) ? 
                    '<count class="">'+count(_sortedKeywords[i])+'</count>' : 
                    '<button><span data-icon="'+sp.getIconPulsations(count(_sortedKeywords[i]))+'"></span></button>';
                var _iconDelete = '<button class="deleteKeyword" action="delete" myKeyword="' + _sortedKeywords[i] + '"><span data-icon="delete" action="delete" myKeyword="' + _sortedKeywords[i] + '"></span></button>';
                _htmlKeywords = _htmlKeywords + '<li id="' + _sortedKeywords[i] + '" action="open" type="keyword" value="' +  _sortedKeywords[i] + '" account=""><a _id_="' + _sortedKeywords[i] + '" ><p _id_="' + _sortedKeywords[i] + '">' + _iconDelete + _iconPulsations + '</p><p><my>' + _sortedKeywords[i] + '</my></p></a></li>';
            }
            
            _htmlKeywords = _htmlKeywords + '</ul>';
        }
        
        // ==========================
        // --- Display feeds list ---
        // ==========================

        for (var i = 0; i < feeds.length; i++) {
            var _feed = feeds[i];
            var _account = _feed._myParams.account;
            var _iconFeed = ((typeof _feed.image === 'object') && (_feed.image.url != "")) ? '<img src="'+_feed.image.url+'"/>' : '';
            var _iconPulsations = (params.feeds.count) ? 
                '<count class="">'+_feed._myNbEntries+'</count>' :  // @todo: FALSE Does not consider entries already in cache. 
                '<button><span data-icon="' + _feed._myPulsationsIcone + '"></span></button>';
            var _iconDelete = '';

            if ((_account == 'local') ||
                ((_account == 'feedly') && (_feedlyAccessToken !== undefined)) ||
                ((_account == 'theoldreader') && (_theoldreaderAuth !== undefined)) || 
                ((_account == 'aolreader') && (_aolreaderAccessToken !== undefined)) ||
                ((_account == 'tinytinyrss') && (_tinytinyrssAuth !== undefined)) 
            ){
                var _class = (_account == 'local') ? "delete" : "delete _online_";
                
                if (!params.settings.proxy.availability[_account]) {
                    _class = _class + ' _proxyNotAvailable_'; // Proxy not available for "aolreader" & "feedly". Not yet implemented.
                }
                    
                _iconDelete = '<button _id_="' + _feed._myDomId + '" action="delete" account="' + _account + '" feedId="' + _feed.feed._myFeedId + '"><span action="delete" account="' + _account + '" feedId="' + _feed.feed._myFeedId + '" data-icon="delete"></span></button>';
            }

            var _myLastPublishedDate = (_feed._myLastTimestamp == 0) ? "No news" : _feed._myLastPublishedDate;

            _html[_account] = _html[_account] + '<li id="' + _feed._myDomId + '" action="open" type="feed" value="' + _feed.feedUrl + '" account="' + _account + '"><a _id_="' + _feed._myDomId + '"><p _id_="' + _feed._myDomId + '">' + _iconDelete + _iconPulsations + '</p>' + _iconFeed + '<p><my>' + _feed.title + '</my></p><p><my><time>' + _myLastPublishedDate + '</time></my></p></a></li>';
        }

        _htmlFeeds = _htmlFeeds +
            '<ul>' +
            '<li id="_" action="open" type="feed" value="" account=""><a _id_="_"><p _id_="_" ><button><span data-icon="forward"></span></button></p><p><my data-l10n-id="all-feeds">' + document.webL10n.get('all-feeds') + '</my></p></a></li>' +
            '</ul>' +
            '' + _htmlKeywords;
        
        my.log('dspFeeds()', _html);
        
        for (var _account in _html) {
            if ((_html[_account] != "") && (_account != "undefined")) {
                _htmlFeeds = _htmlFeeds + '<h2>' + params.accounts[_account].title + '</h2><ul id="' + _account + '" class="' + _account + '">' + _html[_account] + '</ul>';
            } else {
                my.log('dspFeeds() Can\'t add account "'+ _account+'"');
            }
        }
        
        // --- Display ---

        ui.echo("feeds-list", _htmlFeeds, "");
 
        // --- Hightlight selected feed or keyword ---

        ui.uncolorize('feeds-list');
        ui.colorize(params.feeds.selectedFeed.domId);
        if (liveValues['entries']['search']['visible']) {
            ui.colorize(params.feeds.selectedKeyword.domId);
        }

        // =========================
        // --- App start offline ---
        // =========================

        if (liveValues.network.status != 'online') {
            ui._disable();
        }
        
        var end = performance.now();
        my.log("dspFeeds() " + (end - start) + " milliseconds.");
    }

    /**
     * Display entries.
     * Only "box" of entries are displayed.
     * Content of entries are displayed when entries are in viewport.
     * See function "showEntries" in class "MyUi"
     * After rendering a search can be processed using keyword value.
     * @return {customEvent} "dspEntries.done"
     */
    function dspEntries() {

        sortedEntries = sp.getEntries();
        var entries = sp.getEntries();
        var nbDaysAgo = params.entries.nbDaysAgo;
        var feedUrl = params.feeds.selectedFeed.url;
        var feedAccount = params.feeds.selectedFeed.account;
        
        ui.echo('feedsEntriesNbDaysAgo', document.webL10n.get('loading'), '');
        
        clearTimeout(liveValues.timeouts.entries.display);
        
        liveValues.timeouts.entries.display = window.setTimeout(function() {
            
            _setTimestamps();
            
            var start = performance.now();
            
            var _timestampMax = liveValues['timestamps']['max'] - (86400 * nbDaysAgo); // End of current day 23:59:59
            var _partialRendering = ((typeof liveValues['entries']['last'] != 'undefined') && (typeof liveValues['entries']['last']['_myTimestamp'] != 'undefined') && (liveValues.entries.currentlyDisplayed == '') && (nbDaysAgo == 0) && (liveValues.sync.nbDaysAgo == nbDaysAgo) && (liveValues.sync.theme == params.entries.theme) && (liveValues.sync.timestamps.max == _timestampMax) && (liveValues.sync.selectedFeed.url == params.feeds.selectedFeed.url) && (liveValues.sync.selectedFeed.account == params.feeds.selectedFeed.account)) ? true : false;
  
            var _timestampMin = (_partialRendering) ? 
                liveValues['entries']['last']['_myTimestamp'] :
                liveValues['timestamps']['max'] - (86400 * nbDaysAgo) - 86400 + 1;
            
            liveValues.sync.nbDaysAgo = nbDaysAgo;
            liveValues.sync.theme = params.entries.theme;
            liveValues.sync.timestamps.max = _timestampMax;
            liveValues.sync.selectedFeed.url = params.feeds.selectedFeed.url;
            liveValues.sync.selectedFeed.account = params.feeds.selectedFeed.account;

            var _dateMin = new Date(_timestampMin*1000).toString();
            var _dateMax = new Date(_timestampMax*1000).toString();

            my.log("dspEntries() between " + _dateMin + ' - ' + _dateMax + ' - ' + feedAccount + " - " + feedUrl + " - " + nbDaysAgo + " days ago");

            var _previousDaysAgo    = -1; // Count days to groups entries by day.
            var _entrieNbDaysAgo    = 0;

            var _nbEntriesDisplayed = {'small': 0, 'large': 0};

            // ===================
            // --- Get entries ---
            // ===================

            // Get entries for specific feed or get all entries.
            
            tmpEntries = {};
            
            if (feedUrl !== "") {
                
                for (var tsms in entries) {
                    
                    if (entries[tsms]._myTimestamp < _timestampMin) {break;}

                    if ((feedUrl !== "") 
                        && (feedUrl == entries[tsms]._myFeedInformations.feedUrl)
                        && (feedAccount == entries[tsms]._myFeedInformations.feed._myAccount)
                        && (entries[tsms]._myTimestamp < _timestampMax)
                    ){
                        tmpEntries[tsms] = entries[tsms];
                    }
                    
                }

            } else {
                for (var tsms in entries) {
                    if (entries[tsms]._myTimestamp < _timestampMin) {break;}
                    if (entries[tsms]._myTimestamp < _timestampMax) {
                        tmpEntries[tsms] = entries[tsms];
                    }
                }
            }

            my.log('dspEntries()', tmpEntries);

            // =======================
            // --- Display entries ---
            // =======================

            var _htmlEntries = "";
            var _htmlFeedTitle = "";
            var _firstEntrie = true;
            var _theme = params.entries.theme;
                
            for (var i in tmpEntries) {
                
                var _entry = tmpEntries[i];

                if ((feedUrl !== "") 
                    && (feedUrl == _entry._myFeedInformations.feedUrl)
                    && (feedAccount == _entry._myFeedInformations.feed._myAccount)
                ){
                    if (_firstEntrie) {
                        _htmlFeedTitle = _htmlFeedTitle + '<h2>' + _entry._myFeedInformations.title + '</h2>'; // Specific feed title
                        _firstEntrie = false;
                    }
                }

                // ---

                if ((_entry._myTimestamp > _timestampMin) && (_entry._myTimestamp < _timestampMax)) {

                        // Time
                        
                        var _time = _entry._myLocalizedTime;

                        // Small article or not ?

                        var _isSmallEntry = my.isSmallEntry(_entry);

                        // 1st image

                        var _imageUrl = "";
                        
                        // Image ratio

                        var _imageRatio = (_isSmallEntry) ? 's' : 'l';
                        
                        // Try to detect broken image
                        /*var _img = new Image(); 
                        _img.src = _entry._myFirstImageUrl; 

                        if (!_img.complete) {
                            _entry._myFirstImageUrl = "";
                        }*/

                        if (_entry._myFirstImageUrl) {
                            _imageUrl = '<span class="my-' + _theme + '-image-container ' + _theme + '-ratio-image-' + _imageRatio + '"><img tsms="' + _entry._myTimestampInMs + '" src="img/loading.png" data-src="' + _entry._myFirstImageUrl + '"/></span>';
                        } else {
                            _imageUrl = '<span class="my-' + _theme + '-image-container ' + _theme + '-ratio-image-' + _imageRatio + '"><img tsms="' + _entry._myTimestampInMs + '" src="img/empty.png" data-src="img/empty.png"/></span>';
                        }

                        // Entry class ratio ?

                        var _ratioClass = _theme + '-ratio-entry-l';

                        if (_isSmallEntry && (!_entry._myFirstImageUrl)) {
                            _ratioClass = _theme + '-ratio-entry-s';
                        }

                        else if (_isSmallEntry || (!_entry._myFirstImageUrl)) {
                            _ratioClass = _theme + '-ratio-entry-m';
                        }

                        // Account icone ?

                        var _accountIcone = '';

                        if (_entry._myFeedInformations._myParams.account != 'local') {
                            _accountIcone = '<img src="img/' + _entry._myFeedInformations._myParams.account + '.' + _theme + '.png" data-src="img/' + _entry._myFeedInformations._myParams.account + '.' + _theme + '.png" />';
                        }

                        // Content ( Normal / Small )

                        var _content = [];
                        var _html = [];

                        if ((params.entries.theme == 'list') && (!_isSmallEntry)) {
                            _html.push(
                                '<span class="my-'+_theme+'-feed-title">' + _entry._myFeedInformations.title + '</span>',
                                '<span class="my-'+_theme+'-date" publishedDate="' + _entry.publishedDate + '">' + _time + '</span>',
                                '<div class="my-'+_theme+'-image-wrapper">' + _imageUrl + '</div>',
                                '<span class="my-'+_theme+'-title">' + _accountIcone + _entry.title + '</span>',
                                '<span class="my-'+_theme+'-snippet">' + _entry.contentSnippet + '</span>',
                                '<div class="my-'+_theme+'-footer"></div>'
                            );
                            _content.push(
                                '<div class="i my-'+_theme+'-entry-l ' + _ratioClass + '" id="' + i + '" tsms="' + _entry._myTimestampInMs + '">',
                                '</div>'
                            );
                            _nbEntriesDisplayed['large']++;

                        } else if (params.entries.theme == 'list') {
                            _html.push(
                                '<span class="my-'+_theme+'-feed-title">' + _entry._myFeedInformations.title + '</span>',
                                '<span class="my-'+_theme+'-date" publishedDate="' + _entry.publishedDate + '">' + _time + '</span>',
                                '<div class="my-'+_theme+'-image-wrapper">' + _imageUrl + '</div>',
                                '<span class="my-'+_theme+'-title">' + _accountIcone + _entry.title + '&nbsp;<span class="fa fa-external-link"></span></span>',
                                '<span class="my-'+_theme+'-snippet">' + _entry.contentSnippet + '</span>',
                                '<div class="my-'+_theme+'-footer"></div>'
                            );
                            _content.push(
                                '<div class="i _online_ _small_ my-'+_theme+'-entry-s ' + _ratioClass + '" id="' + i + '" tsms="' + _entry._myTimestampInMs + '" entry_link="' + _entry.link + '">',
                                '</div>'
                            );
                            _nbEntriesDisplayed['small']++;

                        } else if (!_isSmallEntry) {
                            _html.push(
                                '<span class="my-'+_theme+'-title">' + _accountIcone + _entry.title + '</span>',
                                '<span class="my-'+_theme+'-feed-title">' + _entry._myFeedInformations.title + '</span>',
                                _imageUrl,
                                '<span class="my-'+_theme+'-date" publishedDate="' + _entry.publishedDate + '">' + _time + '</span>',
                                '<span class="my-'+_theme+'-snippet">' + _entry.contentSnippet + '</span>'
                            );
                            _content.push(
                                '<div class="i my-'+_theme+'-entry-l ' + _ratioClass + '" id="' + i + '" tsms="' + _entry._myTimestampInMs + '">',
                                '</div>'
                            );
                            _nbEntriesDisplayed['large']++;

                        } else {
                            _html.push(
                                '<span class="my-'+_theme+'-title">' + _accountIcone + _entry.title + '</span>',
                                '<span class="my-'+_theme+'-feed-title">' + _entry._myFeedInformations.title + '</span>',
                                _imageUrl,
                                '<span class="my-'+_theme+'-date" publishedDate="' + _entry.publishedDate + '">' + _time + '</span>',
                                '<span class="my-'+_theme+'-snippet">' + _entry.contentSnippet + '</span>'
                            );
                            _content.push(
                                '<div class="i _online_ _small_ my-'+_theme+'-entry-s ' + _ratioClass + '" id="' + i + '" tsms="' + _entry._myTimestampInMs + '" entry_link="' + _entry.link + '">',
                                '</div>'
                            );
                            _nbEntriesDisplayed['small']++;
                        }

                        // Add to html entries

                        _htmlEntries = _htmlEntries + _content.join('');
                        
                        liveValues['entries']['html'][_entry._myTimestampInMs] = _html.join('');

                }
            }

            // --- Display Today / Yesterday / Nb days ago ---
            
            if (nbDaysAgo == 0) {
                _daySeparator = document.webL10n.get('nb-days-ago-today');
            } else if (nbDaysAgo == 1) {
                _daySeparator = document.webL10n.get('nb-days-ago-yesterday');
            } else {
                _daySeparator = document.webL10n.get('nb-days-ago').replace('{{n}}', nbDaysAgo);
            }

            ui.echo('feedsEntriesNbDaysAgo', _daySeparator, '');

            // Store information about scroll position.
            // Used to restore scroll position once "dspEntries" then "search" are done.
            // "search" is executed once custom event "dspEntries.done" is fired.

            if (_partialRendering) {
                var _previousScrollTop = dom['screens']['entries']['scroll'].scrollTop;
                var _previousScrollHeight = dom['screens']['entries']['scroll'].scrollHeight;
            }

            // Display entries:
            
            var start2 = performance.now();
            
            if (_partialRendering) {
                ui.echo("feeds-entries-content", _htmlEntries, "prepend");
            } else {
                if (params.entries.displaySmallEntries && ((_nbEntriesDisplayed['small'] + _nbEntriesDisplayed['large']) > 0)) {
                    ui.echo("feeds-entries-top", _htmlFeedTitle, "");
                    ui.echo("feeds-entries-content", _htmlEntries, "");
                } else if (!params.entries.displaySmallEntries && (_nbEntriesDisplayed['large'] > 0)) {
                    ui.echo("feeds-entries-top", _htmlFeedTitle, "");
                    ui.echo("feeds-entries-content", _htmlEntries, "");
                } else if (!params.entries.displaySmallEntries && (_nbEntriesDisplayed['large'] == 0)) {
                    ui.echo("feeds-entries-top", _htmlFeedTitle, "");
                    ui.echo("feeds-entries-content", '<div class="notification" data-l10n-id="no-news-today">' + document.webL10n.get('no-news-today') + '</div>', "");
                } else if ((_nbEntriesDisplayed['small'] + _nbEntriesDisplayed['large']) == 0) {
                    ui.echo("feeds-entries-top", _htmlFeedTitle, "");
                    ui.echo("feeds-entries-content", '<div class="notification" data-l10n-id="no-news-today">' + document.webL10n.get('no-news-today') + '</div>', "");
                } else {
                    ui.echo("feeds-entries-top", _htmlFeedTitle, "");
                    ui.echo("feeds-entries-content", '<div class="notification" data-l10n-id="error-no-network-connection">' + document.webL10n.get('error-no-network-connection') + '</div>', "");
                } 
            }
            
            var end2 = performance.now();
            
            // Hide/show small entries:
            
            params.entries.displaySmallEntries ?
                ui._smallEntries('show') : ui._smallEntries('hide');

            //

            _previousNbDaysAgo = nbDaysAgo;

            // Mark as read
            
            ui.markAsRead();
            
            // Store informations about last recent entry

            liveValues['entries']['last'] = tmpEntries[Object.keys(tmpEntries)[0]];            
            
            // =========================
            // --- App start offline ---
            // =========================
            
            if (liveValues.network.status != 'online') {
                ui._disable();
            }
            
            document.body.dispatchEvent(new CustomEvent('dspEntries.done', {"detail": {"_partialRendering": _partialRendering, "_previousScrollTop": _previousScrollTop, "_previousScrollHeight": _previousScrollHeight}}));
        
            // --- Eecution time
            
            var end = performance.now();
            my.log("dspEntries() " + (end - start) + " milliseconds.");
            my.log("dspEntries() " + (end2 - start2) + " milliseconds (echo).");
        
        }, 250); // Schedule the execution for later
    }

    /**
     * Set id max for entries. Variable "liveValues['entries']['id']['max']"
     * Set id min for entries. Variable "liveValues['entries']['id']['min']"
     * 
     * News ID outside this range can't be displayed.
     * 
     * Depends of settings...
     * - params.entries.dontDisplayEntriesOlderThan
     * - my.isSmallEntry()
     * - search keyword value
     * 
     * and liveValues['timestamps']['min'], liveValues['timestamps']['max']
     * 
     * @param {null}
     * @return {null}
     */
    function setEntriesIds() {
        my.log('setEntriesIds()');

        // ID max
        
        _setTimestamps();

        var _keys   = Object.keys(sortedEntries); _keys.reverse();
        var _nb     = _keys.length - 1;
        var _string = document.getElementById('inputSearchEntries').value || "";

        while ((sortedEntries[_keys[_nb]]._myTimestamp < liveValues['timestamps']['min'])
            || (!params.entries.displaySmallEntries && my.isSmallEntry(sortedEntries[_keys[_nb]]))
            || (_string !== "" && liveValues['entries']['search']['visible'] && (((sortedEntries[_keys[_nb]].title).toLowerCase()).indexOf(_string.toLowerCase()) == -1))
        ){
            _nb--;
            if (_nb < 0) { break; }
        }
        
        my.log('setEntriesIds() entries = ', sortedEntries);
        my.log('setEntriesIds() search = ' + _string);
        my.log('setEntriesIds() result = ', sortedEntries[_keys[_nb]]);
        
        liveValues['entries']['id']['max'] = _keys[_nb];
        
        // ID min

        my.log('setEntriesIds()');
        
        var _nb     = 0;
        var _string = document.getElementById('inputSearchEntries').value || "";

        while ((sortedEntries[_keys[_nb]]._myTimestamp > liveValues['timestamps']['max'])
            || ((params.entries.displaySmallEntries == false) && (my.isSmallEntry(sortedEntries[_keys[_nb]]) == true)) 
            || (_string !== "" && liveValues['entries']['search']['visible'] && (((sortedEntries[_keys[_nb]].title).toLowerCase()).indexOf(_string.toLowerCase()) == -1))
        ){
            _nb++;
            if (_nb >= _keys.length) { break; }
        }
        
        my.log('setEntriesIds() entries = ', sortedEntries);
        my.log('setEntriesIds() search = ' + _string);
        my.log('setEntriesIds() result = ', sortedEntries[_keys[_nb]]);
        
        liveValues['entries']['id']['min'] = _keys[_nb];
    }

    /**
     * @param {int} entryId
     * @param {string} url
     * @return {CustomEvent} mainEntryOpen.done
     */
    function mainEntryOpenInBrowser(entryId, url) {
        my.log('mainEntryOpenInBrowser()', arguments);
        document.body.style.cssText = "overflow: hidden;";  // Disable scroll in entries list.
        
        share.setAttribute("_mySha256_link", sortedEntries[entryId]['_mySha256_link']);
        share.setAttribute("_mySha256_title", sortedEntries[entryId]['_mySha256_title']);

        if (url == "") {
            my.log('mainEntryOpenInBrowser()', sortedEntries[entryId]);
            var _entry = sortedEntries[entryId];
            var _srcDoc = "";
            var _regex = new RegExp('\'', 'g');
            var _author = "";
            var _enclosure = '';
            
            // enclosure image
            
            if ((typeof _entry.enclosure !== 'undefined') && (_entry.enclosure.link != "")) {
                _enclosure = "<div class=\"entry-enclosure\"><img src=\"" + _entry.enclosure.link + "\" /></div>";
            } /*else if (_entry['_myFirstImageUrl'] != "") { 
                _enclosure = "<div class=\"entry-enclosure\"><img src=\"" + _entry['_myFirstImageUrl'] + "\" /></div>";
            }*/

            //my.log('mainEntryOpenInBrowser()', _entry.content);

            if (_entry.author !== "") {
                _author = '<div class="entry-author"><my data-l10n-id="by">' + document.webL10n.get('by') + '</my> ' + _entry.author + '</div>';
            }

            _srcDoc = _srcDoc + _srcDocCss; // Inline CSS from file "style/inline.css.js"
            _srcDoc = _srcDoc + _enclosure;
            _srcDoc = _srcDoc + '<div class="entry">';
            _srcDoc = _srcDoc + '<div class="entrie-feed-title"><a href="' + _entry._myFeedInformations.link + '">' + _entry._myFeedInformations.title.replace(_regex, "&#39;") + '</a></div>';
            _srcDoc = _srcDoc + '<div class="entrie-title">' + _entry.title.replace(_regex, "&#39;") + '</div>';
            _srcDoc = _srcDoc + '<div class="entrie-date">' + new Date(_entry.publishedDate).toLocaleString(userLocale) + '</div>';
            _srcDoc = _srcDoc + _author;
            _srcDoc = _srcDoc + '<div class="entry-contentSnippet">' + _entry.content.replace(_regex, "&#39;") + '</div>';
            _srcDoc = _srcDoc + '<div class="entrie-visit-website"><a href="' + _entry.link + '"><my data-l10n-id="entry-visit-website">' + document.webL10n.get('entry-visit-website') + '</my></a></div>';
            _srcDoc = _srcDoc + '</div>';

            dom['screens']['entry']['wallabag']['add'].setAttribute("url", _entry.link);
        }
        
        if (url != "") {
            if (liveValues.platform === "linux") {
                ui.echo("browser", '<webview id="electronView" src="' + url + '" ></webview>', "");
            } else {
                ui.echo("browser", '<iframe src="' + url + '" sandbox="allow-same-origin allow-scripts" mozbrowser remote></iframe>', "");
            }
            dom['screens']['entry']['wallabag']['add'].setAttribute("url", url);
        } else {
            if (liveValues.platform === "linux") {
                ui.echo("browser", '<webview id="electronView" src=\'data:text/html;charset=utf-8,' + _srcDoc + '\'></webview>', "");
            } else {
                ui.echo("browser", '<iframe srcdoc=\'' + _srcDoc + '\' sandbox="allow-same-origin allow-scripts" mozbrowser remote></iframe>', "");
            }
        }

        document.getElementById("browser").style.cssText = "display: block;";

        main_entry.scrollTop = 0;
        
        document.body.dispatchEvent(new CustomEvent('mainEntryOpen.done', {"detail": {"entryId": entryId, "url": url, "_mySha256_link": sortedEntries[entryId]['_mySha256_link'], "_mySha256_title": sortedEntries[entryId]['_mySha256_title']}}));

        ui._quickScrollTo(1);
    }

    /**
     * @param {null}
     * Update feeds pulsations once all feeds are loaded.
     */
    function updateFeedsPulsations() {
        var _tmp = [];
        var _feeds = sp.getFeeds();
        var _pulsations;
        var _feed = '';

        for (var _account in myFeedsSubscriptions) {

            for (var i = 0 ; i < myFeedsSubscriptions[_account].length; i++) {

                for (var j = 0 ; j < _feeds.length; j++) {

                    if (myFeedsSubscriptions[_account][i].url == _feeds[j].feedUrl) {

                        _url        = _feeds[j].feedUrl;
                        _pulsations = _feeds[j]._myPulsations;

                        if (isNaN(_pulsations)) {
                            // do nothing
                        } else {
                            myFeedsSubscriptions[_account][i].pulsations = _pulsations;
                        }

                        break;
                    }
                }
            }
        }
    }

    /**
     * Set timestamps values Min & Max.
     * Variable "liveValues['timestamps']['max']" End of day timestamp. 
     * Variable "liveValues['timestamps']['min']" Value beyond which an entry can't be displayed. (Too old)
     * @param {null}
     */
    function _setTimestamps() {
        var _now    = new Date();
        var _year   = _now.getFullYear();
        var _month  = _now.getMonth();
        var _day    = _now.getDate();

        var _myDate = new Date(_year, _month, _day, '23','59','59');
        
        liveValues['timestamps']['max'] = Math.floor(_myDate.getTime() / 1000);

        liveValues['timestamps']['min'] = liveValues['timestamps']['max'] - (86400 * params.entries.dontDisplayEntriesOlderThan) + 1;
    }

    // Callback for ALL subscriptions promises
    // 1st feeds loading.

    function initAndLoadFeeds(subscriptions) {
        my.log('initAndLoadFeeds()', arguments);

        // Load feed content from 'network' after app install (First launch) 
        // otherwise from local 'cache' to increase startup performances.
        // @todo
        // depuis 'network' si la dernière synchro date de la veille.
        // liveValues['sync']['timestamps']['lastUpdate'] < liveValues['timestamps']['max'] - (86400) (début de journée)
        (typeof localStorage.getItem('subscriptions.local.json') === 'string') ? sp.setOrigin('cache') : sp.setOrigin('network');

        // Add feeds from subscription(s) file(s)
        // subscriptions.local.json
        // subscriptions.feedly.json
        // subscriptions.theoldreader.json
        // subscriptions.aolreader.json
        // subscriptions.tinytinyrss.json
        // ...

        for (var i = 0; i < subscriptions.length; i++) {
            for (var j = 0; j < subscriptions[i].length; j++) {
                my.log('initAndLoadFeeds()', subscriptions[i][j]);
                var _account = subscriptions[i][j].account;
                if (myFeedsSubscriptions[_account] === undefined) {
                    myFeedsSubscriptions[_account] = [];
                }
                if (_account == "local" || params.accounts[_account].logged) {
                    myFeedsSubscriptions[_account].push(subscriptions[i][j]);
                }
            }
        }

        // No feeds sets.
        // Use default feeds ?

        var _nbFeedsSubscriptions = 0;

        for (var _account in myFeedsSubscriptions) {
            _nbFeedsSubscriptions = _nbFeedsSubscriptions + myFeedsSubscriptions[_account].length;
        }

        if (typeof localStorage.getItem('subscriptions.local.json') !== 'string') {
            var _local = '';
            var _confirm = window.confirm(document.webL10n.get('confirm-use-default-feeds'));
            if (_confirm) {
                var _populateMySubscriptions = [
                    {"url": "https://www.reddit.com/r/FireFoxOS/.rss",          "pulsations": 2,    "account": "local", "id": "https://www.reddit.com/r/FireFoxOS/.rss"},
                    {"url": "http://www.webupd8.org/feeds/posts/default",       "pulsations": 2,    "account": "local", "id": "http://www.webupd8.org/feeds/posts/default"},
                    {"url": "http://metro.co.uk/sport/football/feed/",          "pulsations": 5,    "account": "local", "id": "http://metro.co.uk/sport/football/feed/"},
                    {"url": "http://sourceforge.net/blog/feed/",                "pulsations": 2,    "account": "local", "id": "http://sourceforge.net/blog/feed/"},
                    {"url": "http://www.gorillavsbear.net/category/mp3/feed/",  "pulsations": 2,    "account": "local", "id": "http://www.gorillavsbear.net/category/mp3/feed/"},
                    {"url": "http://www.wired.com/feed/",                       "pulsations": 5,    "account": "local", "id": "http://www.wired.com/feed/"}
                ];

                for (var i = 0; i < _populateMySubscriptions.length; i++) {
                    myFeedsSubscriptions.local.push(_populateMySubscriptions[i]);
                    _nbFeedsSubscriptions++;
                }

                _local = JSON.stringify(myFeedsSubscriptions.local);
            } else {
                _local = '[]';
            }

            my._save("subscriptions.local.json", "application/json", _local).then(function(results) {
                my.log('Save file subscriptions.local.json');
            }).catch(function(error) {
                my.error("ERROR saving file ", error);
                my.alert("ERROR saving file " + error.filename);
            });
            
        }

        // 1st feeds loading

        my.log('========================');
        my.log(myFeedsSubscriptions);
        my.log('========================');

        if (_nbFeedsSubscriptions > 0) {
            sp.setFeedsSubscriptions(myFeedsSubscriptions);
            loadFeeds();
        }

        sp.setOrigin('network');

        // ---

        dspSettings();
    }
    /**
     * Save object/variable in local storage
     * @param string variable (params, keywords, liveValues)
     */
    function _save(variable) {
        var _filename = variable + '.json';
        var _type = "application/json";
        //var _content = eval(variable); // Blocked by CSP

        switch(variable) {
            case 'params':
                _content = params; break;
            case 'keywords':
                _content = keywords; break;
            case 'liveValues':
                _content = liveValues; break;
            default:
                break;
        } 

        if (variable === 'params') {
            _content.entries.nbDaysAgo = 0;  // Reset nbDaysAgo value before saving file.
        }

        my._save(_filename, _type, JSON.stringify(_content)).then(function(results) {
            my.log("Save "+_filename);
        }).catch(function(error) {
            my.error("ERROR saving file "+_filename, error);
            my.alert('ERROR saving file '+_filename);
        });
    }
    
    /**
     * Disable online account
     * @param {string} feedly, theoldreader, aolreader, tinytinyrss
     */
    function _disableAccount(_account) {
        if (_account !== 'local') {
            my.log('_disableAccount', arguments);
            my.alert('Disable account "' + _account + '"');
            params.accounts[_account].logged = false
                myFeedsSubscriptions[_account] = [];
            sp.setFeedsSubscriptions(myFeedsSubscriptions);
            sp.deleteEntries(_account, '');
            _save('params');
        }
        
        try {document.getElementById(_account+'Form').style.cssText = 'display: block';} catch(e) {};   // Enable form
        try {document.getElementById(_account+'Checkbox').checked = false;} catch(e) {};                // Deselect checkbox
    }

    /**
     * Add new feeds in array myFeedsSubscriptions
     * if feeds doesn't exists in array.
     * @param {_feeds} array
     */
    function addNewSubscriptions(_feeds) {
        var start = performance.now();
        
        my.log('addNewSubscriptions()', arguments);
        for (var i = 0; i < _feeds.length; i++) {
            _addNewSubscription(_feeds[i]);
        }
        
        var end = performance.now();
        my.log("addNewSubscriptions() " + (end - start) + " milliseconds.");
    }

    function _addNewSubscription(_feed) {
        my.log('_addNewSubscription()', arguments);

        var _insertNewFeed = true;
        var _account = _feed.account;

        if (myFeedsSubscriptions[_account] === undefined) {
            myFeedsSubscriptions[_account] = [];
        }

        var i = myFeedsSubscriptions[_account].length;
        while (i--) {
            if (myFeedsSubscriptions[_account][i].id === _feed.id) {
                _insertNewFeed = false;
                break;
            }
        }

        if (_insertNewFeed) {
            myFeedsSubscriptions[_account].push(_feed);
        }
    }
    
    /**
     * Localize times who are visibles in viewport
     */
    function localizeTimes() {
        var className = 'my-'+params.entries.theme+'-date';
        var elements = document.getElementsByClassName(className);
        for (var i = 0; i < elements.length; i++) {
            if (ui.isInViewport(elements[i]) && (elements[i].textContent == "")) {
                var _publishedDate = elements[i].getAttribute('publishedDate');
                elements[i].textContent = new Date(_publishedDate).toLocaleTimeString(userLocale);
            }
        }
    }
    
    /**
     * Count entries matching specified keyword
     * @param {string} keyword
     * @return {int}
     */
    function count(keyword){
        var out = 0;
        
        entries = sp.getEntries();

        var _regex = new RegExp(keyword, "gi");

        for (var i in entries) {
            if ((!params.entries.displaySmallEntries && my.isSmallEntry(entries[i])) 
                || (entries[i].id > liveValues['timestamps']['max'])
            ){
                // nothing to do
            } else if ((entries[i].title).match(_regex)) {
                out++;
            }
        }

        return out;
    }
                            
    // ======================
    // --- Ready to start ---
    // ======================

    window.onload = function () {

        _swipe(dom['screens']['feeds'], "");
        _swipe(dom['screens']['entries']['scroll'], "");
        _swipe(dom['screens']['settings'], "");
        
        // Promises V1 

        var promise1 = my._load('subscriptions.local.json').then(function(results) {return results;}
        ).catch(function(error) {/*_disableAccount('local');*/ return {};});

        var promise2 = my._load('subscriptions.feedly.json').then(function(results) {return results;}
        ).catch(function(error) {_disableAccount('feedly'); return {};});

        var promise3 = my._load('subscriptions.theoldreader.json').then(function(results) {return results;}
        ).catch(function(error) {_disableAccount('theoldreader'); return {};});
        
        var promise4 = my._load('subscriptions.aolreader.json').then(function(results) {return results;}
        ).catch(function(error) {_disableAccount('aolreader'); return {};});

        var promise5 = my._load('subscriptions.tinytinyrss.json').then(function(results) {return results;}
        ).catch(function(error) {_disableAccount('tinytinyrss'); return {};});
 
        var arrayPromises = [promise1, promise2, promise3, promise4, promise5];

        Promise.all(arrayPromises).then(function(arrayOfResults) {
            initAndLoadFeeds(arrayOfResults);
        }).catch(function(error) {
            my.alert('KO all promises', error.message);
        });

        // Promises V2
        /*var arrayPromises = [];
        var i = 0;

        for (var _account in myFeedsSubscriptions) {
            arrayPromises[i] = my._load('subscriptions.' + _account + '.json').then(function(results) {return results;}
            ).catch(function(error) {params.accounts[_account].logged = false; _save('params'); return {};});
            i++;
        }

        Promise.all(arrayPromises).then(function(arrayOfResults) {
            initAndLoadFeeds(arrayOfResults);
        }).catch(function(error) {
            my.alert('KO all promises', error.message);
        });*/

        // =================================
        // --- Button load subscriptions ---
        // =================================
        // Disable button if subscriptions file doesn't exists.

        /*my._file_exists('subscriptions.local.json', function(exists){
            if (!exists) {
                ui._onclick(loadSubscriptions, 'disable');
            }
        });*/

        // ====================================================
        // --- INIT Network connection : online / offline ? ---
        // ====================================================
        // Does not works !
        // navigator.onLine is not correctly detected !!!!!!!!!
 
        /*var _networkStatus = (navigator.onLine == true) ? 'online' : 'offline';

        var _uiStatus = (_networkStatus == 'online') ? 'enable' : 'disable';

        document.body.dispatchEvent(new CustomEvent('networkConnection.change', {"detail": liveValues.network.status}));

        liveValues.network.status = _networkStatus; // Store current connection status

        ui.toggle(_uiStatus);*/

        // Workaround :(

        function isOnline(yes, no) {
            var xhr = new XMLHttpRequest({ mozSystem: true });
            xhr.onload = function() {
                if (yes instanceof Function) {
                    yes();
                }
            }
            xhr.onerror = function(e){
                if (no instanceof Function) {
                    no();
                }
            }
            //xhr.open("GET", "https://duckduckgo.com/?" + (new Date()).getTime(), true);
            xhr.open("GET", (sp.getServers())[sp.getServerId()].url + "LICENSE.txt?" + (new Date()).getTime(), true);
            xhr.send();
        }

        isOnline(
            function() {
                liveValues.network.status = 'online';
                ui.toggle('enable');
            },
            function() {
                liveValues.network.status = 'offline';
                ui.toggle('disable');
            }
        );

        // ======================================================
        // --- UPDATE Network connection : online / offline ? ---
        // ======================================================

        function updateNetworkStatus(event) {
            my.log("Network event ", event);
            
            if (liveValues.network.status != event.type) {
                
                var _status = (event.type == 'online') ? 'enable' : 'disable';
                
                document.body.dispatchEvent(new CustomEvent('networkConnection.change', {"detail": liveValues.network.status}));
                
                liveValues.network.status = event.type; // Store current connection status
                
                ui.toggle(_status);
            }
            
            // --- Fix some network change issues
            // Sync button is disabled but navigator is online & no synchro is in progress !
            if (((ui._status(sync) == 'disable') || ((typeof(lastUpdate) == "object") && ui._status(lastUpdate) == 'disable')) && (liveValues.sync.nbFeedsToLoad == 0) && (event.type == 'online') && (liveValues.network.status == 'online')) {
                ui._enable();
            }
        }

        window.addEventListener('online',  updateNetworkStatus);
        window.addEventListener('offline', updateNetworkStatus);
        
        // =================
        // --- Intervals ---
        // =================
        
        // --- Memory cleanup (Remove old entries) ---

        setInterval(function() {
            var _maxNbDaysAgo = params.settings.days.last();
            var _timestampMax = liveValues['timestamps']['max'] - (86400 * _maxNbDaysAgo); // Today 23:59:59
            sp.deleteOldEntries(_timestampMax);
        }, 60000);
        
        // --- Load images in viewport & localize times ---
        
        setInterval(function() {
            if (!liveValues.animations.inProgress && !liveValues.animations.swipe) {
                ui.showEntries();
                ui.loadImages();
                localizeTimes();
            }
        }, 350);

        // --- Automatic update entries every N seconds ---

        window.setInterval(function() {
            var _nowInterval = Math.round(Date.now()/1000);
            if ((liveValues.network.status == 'online') && ((_nowInterval - liveValues.sync.timestamps.lastUpdate) >= params.entries.updateEvery)) {
                loadFeeds();
            }
        }, 59000); // 59s Less than minimal Firefox OS sleep time (60s)

        // --- AOL Reader ---        
        // Due to quick expiration time (1h), Aol token is 
        // actualized every 14mn.

        setInterval(function() {
            if ((liveValues.network.status == 'online') && (params.accounts.aolreader.logged)) {
                aolreader.updateToken();
            }
        }, (60000 * 14));
        
        // --- Wallabag enable/disable add button ---
        
        window.setInterval(function() {
            if ((params.accounts.wallabag.logged) 
                && (liveValues.network.status === 'online') 
                && dom['screens']['entry']['wallabag']['add'].classList.contains("disable")
            ){
                ui._onclick(dom['screens']['entry']['wallabag']['add'], 'enable');
            } else if ((liveValues.network.status === 'offline')
                || ((params.accounts.wallabag.logged === false) && (dom['screens']['entry']['wallabag']['add'].classList.contains("enable")))
            ){
                ui._onclick(dom['screens']['entry']['wallabag']['add'], 'disable');
            } else {
            }
        }, 500);

        // =================
        // --- UI events ---
        // =================

        sync.onclick = function(event) {
            if (liveValues.network.status == 'online') {
                ui._vibrate();
                loadFeeds();
            }
        }

        closeMainEntry.onclick = function(event) { 
            ui._vibrate(); 
            ui._quickScrollTo(0); 
            ui.echo("browser", "", ""); 
            liveValues.entries.currentlyDisplayed = '';
        }

        // Screen find feed

        findFeedsOpen.onclick = function(event) { ui._vibrate(); ui._scrollTo(-2); }
        findFeedsClose.onclick = function(event) { ui._vibrate(); ui._scrollTo(-1); }

        findFeedsSubmit.onclick = function(event) { 
            event.stopPropagation();
            event.preventDefault();
            ui._vibrate();
            var _url = document.getElementById("findFeedsText").value; 
            if (_url) {
                ui.echo("find-feeds", "Loading...", ""); 
                sp.isValidUrl(_url).then(function(results) {
                    my.log("Is a valid url OK", results);
                }).catch(function(error) {
                    my.message(document.webL10n.get("find-feeds-error") + JSON.stringify(error));
                });
            }
        }

        findFeedsReset.onclick = function(event) { ui._vibrate(); ui.echo('find-feeds', '', ''); }

        // Screen feeds list

        document.getElementById("shareFeedsList").onclick = function(event) {
            my.export('opml', true);
        }

        // Themes

        displayGrid.onclick = function(event) {
            if (params.entries.theme != 'grid') {
                params.entries.theme = "grid";
                ui._vibrate();
                ui.selectThemeIcon();
                dspEntries();
                _save('params');
            }
        }
        displayCard.onclick = function(event) {
            if (params.entries.theme != 'card') {
                params.entries.theme = "card";
                ui._vibrate();
                ui.selectThemeIcon();
                dspEntries();
                _save('params');
            }
        }
        displayList.onclick = function(event) {
            if (params.entries.theme != 'list') {
                params.entries.theme = "list";
                ui._vibrate();
                ui.selectThemeIcon();
                dspEntries();
                _save('params');
            }
        }

        nextDay.onclick = function(event) {
            ui._vibrate();
            if (params.entries.nbDaysAgo > 0 ) {
                params.entries.nbDaysAgo--;
            }
            ui._onclick(previousDay, 'enable');
            if (params.entries.nbDaysAgo == 0) {
                ui._onclick(nextDay, 'disable');
            } else {
                ui._onclick(nextDay, 'enable');
            }
            dspEntries();
            dom['screens']['entries']['scroll'].scrollTop = 0;
        }

        previousDay.onclick = function(event) {
            ui._vibrate();
            if (params.entries.nbDaysAgo < params.entries.dontDisplayEntriesOlderThan) {
                params.entries.nbDaysAgo++;
            }
            ui._onclick(nextDay, 'enable');
            if (params.entries.nbDaysAgo == params.entries.dontDisplayEntriesOlderThan) {
                ui._onclick(previousDay, 'disable');
            } else {
                ui._onclick(previousDay, 'enable');
            }
            dspEntries();
            dom['screens']['entries']['scroll'].scrollTop = 0;
        }

        // ==========================
        // --- Events: Feeds list ---
        // ==========================
 
        // Feeds list: Click on keyword or feed
        
        document.getElementById("feeds-list").onclick = function(e) {
            var _this = e.target;
            
            var _domId      = _this.getAttribute('id') || _this.getAttribute('_id_') || _this.parentNode.getAttribute('_id_') || _this.parentNode.parentNode.getAttribute('_id_');
            var _li         = document.getElementById(_domId);

            var _account    = _li.getAttribute('account');   // local, feedly, etc...
            var _action     = _this.getAttribute('action') || _li.getAttribute('action');    // delete, open
            var _type       = _li.getAttribute('type');      // keyword, feed
            var _value      = _li.getAttribute('value');

            // Open keyword

            if ((_action === 'open') && (_type === 'keyword') && (_value !== '')) {
                ui.uncolorize('keywords');
                ui.colorize(_value);
                ui._vibrate();
                ui._scrollTo(0);
                ui._onclick(nextDay, 'disable');
                ui._onclick(previousDay, 'enable');
                params.entries.nbDaysAgo = 0;
                params.feeds.selectedKeyword.value = _value;
                params.feeds.selectedKeyword.domId = _domId;
                // Set a search on keyword after displaying entries
                liveValues['entries']['search']['visible'] = true;
                document.getElementById('inputSearchEntries').value = _value;
                // ---
                dspEntries();
            }

            // Open feed
            
            if ((_action === 'open') && (_type === 'feed')) {
                // @todo Change these 6 lines
                try {ui.uncolorize('_');} catch(e) {};
                try {ui.uncolorize('local');} catch(e) {};
                try {ui.uncolorize('aolreader');} catch(e) {};
                try {ui.uncolorize('feedly');} catch(e) {};
                try {ui.uncolorize('theoldreader');} catch(e) {};
                try {ui.uncolorize('tinytinyrss');} catch(e) {};
                ui.colorize(_domId);
                ui._vibrate();
                ui._scrollTo(0);
                ui._onclick(nextDay, 'disable');
                ui._onclick(previousDay, 'enable');
                params.entries.nbDaysAgo = 0;
                params.feeds.selectedFeed.url = _value;
                params.feeds.selectedFeed.account = _account;
                params.feeds.selectedFeed.domId = _domId;
                _save('params');
                dspEntries();
            }

            // Delete keyword

            if ((_action === 'delete') && (_type === 'keyword')) {
                ui._vibrate();
                e.stopPropagation();
                e.preventDefault();
                deleteKeyword(_this);
            }

            // Delete feed
 
            if ((_action === 'delete') && (_type === 'feed')) {
                ui._vibrate();
                e.stopPropagation();
                e.preventDefault();
                deleteFeed(_this); 
            }

            // ---
        }

        // ===============================
        // --- Listeners: Entries list ---
        // ===============================
       
        // Entries list: Click on entry
        
        document.getElementById("feeds-entries-content").onclick = function(e) {
            var _tsms = e.target.getAttribute("tsms") || e.target.parentNode.getAttribute("tsms");
            var _url = e.target.getAttribute("entry_link") || e.target.parentNode.getAttribute("entry_link") || "";
            var _entry = document.getElementById(_tsms);
            if (_tsms) {
                ui._vibrate(); 
                ui.markAsRead(_entry);
                liveValues.screens.feedsList.opened = false;
                mainEntryOpenInBrowser(_tsms, _url); 
            }
        } 
  
        // Search entries after "dspEntries"
        // Display form then do a search.
        // Restore scroll position.
        
        document.body.addEventListener('dspEntries.done', function(event){
            if (liveValues['entries']['search']['visible']) {
                ui._searchEntriesOpen(false); // No focus
                ui._search(document.getElementById('inputSearchEntries').value);
            } 
            // Restore scroll position
            if (event.detail._partialRendering) {
                my.log('dspEntries.done', event.detail);
                var _newScrollHeight = dom['screens']['entries']['scroll'].scrollHeight;
                dom['screens']['entries']['scroll'].scrollTop = (event.detail._previousScrollTop + (_newScrollHeight-event.detail._previousScrollHeight));
            } 
        });

        /* ====================================== */
        /* --- Listeners: Search Entries Form --- */
        /* ====================================== */
 
        // Add keyword

        addKeyword.onclick = function() {
            ui._vibrate();
            var _myKeyword = document.getElementById('inputSearchEntries').value;

            if (_myKeyword.length > 0) {
                var _confirm = window.confirm(document.webL10n.get('confirm-add-keyword') + "\n" + _myKeyword);

                if ((_confirm) && (!keywords.contains(_myKeyword))) {
                    keywords.push(_myKeyword);
                    _save('keywords');
                    
                    params.feeds.selectedKeyword.value = _myKeyword;
                    params.feeds.selectedKeyword.domId = _myKeyword;

                    // Reload UI
                    
                    liveValues['entries']['search']['visible'] = true;

                    if ((myFeedsSubscriptions.local.length > 0) ||
                        (myFeedsSubscriptions.feedly.length > 0) ||
                        (myFeedsSubscriptions.theoldreader.length > 0) || 
                        (myFeedsSubscriptions.aolreader.length > 0) || 
                        (myFeedsSubscriptions.tinytinyrss.length > 0)
                    ){
                        loadFeeds();
                    } else {
                        ui.echo("feeds-list", "", "");
                        ui.echo("feeds-entries-content", "", "");
                        ui._onclick(sync, 'disable');
                    }
                    
                    // Done
                    
                    my.message(document.webL10n.get('keyword-was-added'));
                } else {
                    my.message(document.webL10n.get('keyword-was-not-added'));
                }
            
            }
        }
      
        // Keyboard
        
        window.addEventListener("keyup", function (event) {
            if (document.activeElement.id == "inputSearchEntries") {
                if (event.keyCode == 13) {
                    event.stopPropagation();
                    event.preventDefault();
                    document.getElementById('inputSearchEntries').blur(); // Remove focus
                    ui._search(document.activeElement.value);
                }
                // Try to colorize an existing keyword following input value
                ui.uncolorize('keywords');
                ui.colorize(inputSearchEntries.value);
            }
        }, true);

        // Search on input change
        
        document.getElementById('inputSearchEntries').addEventListener('input', function(){
            var _searchString = document.getElementById('inputSearchEntries').value;
            ui._search(_searchString);
        });
        
        /* ======================= */
        /* --- Listeners: Misc --- */
        /* ======================= */

        browser.addEventListener('mozbrowsererror', function (event) {
            console.dir("Moz Browser loading error : " + event.detail);
        });
        
        // The "visibilitychange" event is fired when the content 
        // of a tab has become visible or has been hidden.
        
        document.addEventListener("visibilitychange", function() {
            if (document.visibilityState == 'visible') {
                var _now = Math.round(Date.now()/1000);
                if ((_now - params.entries.updateEvery) > liveValues.sync.timestamps.lastUpdate) {
                    loadFeeds();
                }
            }
        });
 
        // Set the 'lang' and 'dir' attributes to <html> when the page is translated
        
        window.addEventListener('localized', function() {
            document.documentElement.lang = document.webL10n.getLanguage();
            document.documentElement.dir = document.webL10n.getDirection();
        }, false);

        /* ================================ */
        /* --- Listener: Selected entry --- */
        /* ================================ */
        
        // Next entry
        
        dom['screens']['entry']['next']['button'].onclick = function() {
            ui._vibrate();
            mainEntryOpenInBrowser(this.getAttribute("tsms"), this.getAttribute("entry_link")); 
        }

        // Previous entry
        
        dom['screens']['entry']['previous']['button'].onclick = function() {
            ui._vibrate();
            mainEntryOpenInBrowser(this.getAttribute("tsms"), this.getAttribute("entry_link")); 
        }
        
        // Share entry :
        // https://developer.mozilla.org/fr/docs/Web/API/Web_Activities

        share.onclick = function() {
            my.log(this);
            ui._vibrate();
            var _entryId = 0;
            var _mySha256_title = this.getAttribute("_mySha256_title");
            var _mySha256_link  = this.getAttribute("_mySha256_link");
            
            for (var i in sortedEntries) {
                if ((sortedEntries[i]['_mySha256_title']== _mySha256_title) ||
                    (sortedEntries[i]['_mySha256_link'] == _mySha256_link)) {
                    var _entryId = i;
                    break;
                }
            }
            
            var _entry = sortedEntries[_entryId];
            my.log(_entry);
            
            if (liveValues.platform === 'linux') {
                
                if (typeof process === 'object') {
                    var ipcRenderer = require('electron').ipcRenderer;

                    ipcRenderer.send('sendEmail', encodeURIComponent(_entry.title), encodeURIComponent(_entry.link));

                    ipcRenderer.on('asynchronous-reply', function(event, arg){
                        console.log(arg);
                    });

                    ipcRenderer.send('asynchronous-message', 'ping');
                }

            } else if (cordova.platformId === 'firefoxos') {
                new MozActivity({
                    name: "new",
                    data: {
                        type: ["websms/sms", "mail"],
                        number: 0,
                        url: "mailto:?subject=" + encodeURIComponent(_entry.title) + "&body=" + encodeURIComponent(_entry.link),
                        body: _entry.title + "\n" + _entry.link
                    }
                });
            }
            
            // Cordova share via plugin    
            // https://www.npmjs.com/package/cordova-plugin-x-socialsharing
            
            else {
                window.plugins.socialsharing.shareViaEmail(
                    _entry.title + "\n" + _entry.link, // Message
                    _entry.title, // Subject
                    null, // TO: must be null or an array
                    null, // CC: must be null or an array
                    null, // BCC: must be null or an array
                    null, // FILES: null, a string, or an array
                    function(){console.log('ok');}, // Called when email was sent or canceled, no way to differentiate
                    function(){console.log('ko');}  // Called when something unexpected happened
                );
            }
    
        };
        
        // Wallabag add
        
        dom['screens']['entry']['wallabag']['add'].onclick = function() {
            ui._vibrate();
            var _confirm = window.confirm(document.webL10n.get('wallabag-add-url-confirm'));
            if (_confirm) {
                my.log('Wallabag add' + this.getAttribute("url"));
                wallabag.add(this.getAttribute("url"));
            }
        }

        // Main entry open done...
        // Update next entry [<] & previous entry [>] buttons. (Only for selected day)
        // Update next & previous entries titles
        
        document.body.addEventListener('mainEntryOpen.done', function(event){
            
            ui.markAsRead(event.detail.entryId); // Mark entry as read
            liveValues.entries.currentlyDisplayed = event.detail.entryId;
            setEntriesIds(); // Set values liveValues['entries']['id']['max'] & liveValues['entries']['id']['min']
            
            var _mySha256_title = event.detail["_mySha256_title"];
            var _mySha256_link  = event.detail["_mySha256_link"];
            
            var _inputSearchEntries = document.getElementById('inputSearchEntries').value || "";
            
            var _previousTsMs = null;
            var _tsms = null;
            var _nextTsMs = null;
            
            var _keys = Object.keys(sortedEntries); // Example ["1471968518255", "1471961308308", "1471957680303", "1471939698318"]
            
            for (var k = 0; k < _keys.length; k++) {
                if ((sortedEntries[_keys[k]]['_mySha256_title']== _mySha256_title) ||
                    (sortedEntries[_keys[k]]['_mySha256_link'] == _mySha256_link)
                ){
                    var _tsms = _keys[k];
                    break;
                }
            }
            // Output variables : _tsms, _k (Array id)
            
            // [<] [>] buttons
            
            // [>]
            
            _previousTsMs = _tsms;
            
            for (var _i = (k+1); _i < _keys.length; _i++) {
                _previousTsMs = _keys[_i];
                _content = (sortedEntries[_previousTsMs]._myFeedInformations.title + ' ' + sortedEntries[_previousTsMs].title + ' ' + sortedEntries[_previousTsMs].contentSnippet).toLowerCase();
                if (((params.entries.displaySmallEntries == false) && (my.isSmallEntry(sortedEntries[_keys[_i]])))
                    || ((params.entries.displaySmallEntries == true) && (my.isSmallEntry(sortedEntries[_keys[_i]])) && (liveValues.network.status == 'offline'))
                    || (_inputSearchEntries !== "" && liveValues['entries']['search']['visible'] && (_content.indexOf(_inputSearchEntries.toLowerCase()) == -1))
                ){
                    continue;
                } else {
                    break;
                }
            }
            
            // [<]
            
            _nextTsMs = _tsms;
            
            for (var _j = (k-1); _j >= 0; _j--) {
                _nextTsMs = _keys[_j];
                _content = (sortedEntries[_nextTsMs]._myFeedInformations.title + ' ' + sortedEntries[_nextTsMs].title + ' ' + sortedEntries[_nextTsMs].contentSnippet).toLowerCase();
                if (((params.entries.displaySmallEntries == false) && (my.isSmallEntry(sortedEntries[_keys[_j]])))
                    || ((params.entries.displaySmallEntries == true) && (my.isSmallEntry(sortedEntries[_keys[_j]])) && (liveValues.network.status == 'offline'))
                    || (_inputSearchEntries !== "" && liveValues['entries']['search']['visible'] && (_content.indexOf(_inputSearchEntries.toLowerCase()) == -1))
                ){
                    continue;
                } else {
                    break;
                }
            }
            
            my.log(_nextTsMs+ ' [<] '+ _tsms +' [>] ' +_previousTsMs);

            // [<]
            
            if (my.isSmallEntry(sortedEntries[_nextTsMs])) {
                dom['screens']['entry']['next']['button'].setAttribute("tsms", _nextTsMs);
                dom['screens']['entry']['next']['button'].setAttribute("entry_link", sortedEntries[_nextTsMs].link);
            } else {
                dom['screens']['entry']['next']['button'].setAttribute("tsms", _nextTsMs);
                dom['screens']['entry']['next']['button'].setAttribute("entry_link", "");
            }
            
            // [>]
            
            if (my.isSmallEntry(sortedEntries[_previousTsMs])) {
                dom['screens']['entry']['previous']['button'].setAttribute("tsms", _previousTsMs);
                dom['screens']['entry']['previous']['button'].setAttribute("entry_link", sortedEntries[_previousTsMs].link);
            } else {
                dom['screens']['entry']['previous']['button'].setAttribute("tsms", _previousTsMs);
                dom['screens']['entry']['previous']['button'].setAttribute("entry_link", "");
            }
            
            // Disable / enable button [<]

            if ((_nextTsMs > liveValues['entries']['id']['max']) || (_nextTsMs == _tsms)) {
                ui._onclick(dom['screens']['entry']['next']['button'], 'disable');
                ui.echo("nextEntryTitle", "", "");
            } else {
                ui._onclick(dom['screens']['entry']['next']['button'], 'enable');
                ui.echo("nextEntryTitle", sortedEntries[_nextTsMs].title, "");
            }
            
            // Disable / enable button [>]
            
            if ((_previousTsMs < liveValues['entries']['id']['min']) || (_previousTsMs == _tsms)) {
                ui._onclick(dom.entry['previous']['button'], 'disable');
                ui.echo("previousEntryTitle", "", "");
            } else {
                ui._onclick(dom.entry['previous']['button'], 'enable');
                ui.echo("previousEntryTitle", sortedEntries[_previousTsMs].title, "");
            }
            
            // ---
            
        });
        
        /* ================= */
        /* --- Listeners --- */
        /* ================= */

        var _sp_            = new MyListeners_SimplePie();
        var _aolreader_     = new MyListeners_AolReader();
        var _feedly_        = new MyListeners_Feedly();
        var _theoldreader_  = new MyListeners_TheOldReader();
        var _tinytinyrss_   = new MyListeners_TinyTinyRss();
        var _wallabag_      = new MyListeners_Wallabag();
        
        // ============
        // --- Main ---
        // ============

        ui.init();
        ui._quickScrollTo(0);
    };
