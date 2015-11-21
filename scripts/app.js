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
    
    var my = new MyFeeds();
    var ui = new MyUi();
    var myManifest = my._loadJSON('manifest.webapp');

    var theoldreader = new TheOldReader();
    var feedly = new Feedly();
    var aolreader = new AolReader();
    var tinytinyrss = new TinyTinyRss();

    var gf = new GoogleFeed();

    var myFeedsSubscriptions = {'local': [], 'aolreader': [], 'feedly': [], 'theoldreader': [], 'tinytinyrss': []} ; // Store informations about feeds (urls)

    var params = {
        "version": 2.4,
        "changelog": "https://git.framasoft.org/thierry-bugeat/myFeeds/raw/master/CHANGELOG",
        "feeds": {
            "selectedFeed": "",                 // Display all feeds if empty otherwise display specified feed url
            "defaultPulsations": 5              // Default feed pulsations
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
            "days": [3, 5, 7, 10],
            "proxy": {
                "use": false,                   // Use proxy to get url content
                "host": "54.229.143.103",
                "availability": {
                    "local": true,
                    "feedly": false,            // Not yet implemented
                    "theoldreader": true,
                    "aolreader": false,         // Not yet implemented
                    "tinytinyrss": false        // Not yet implemented
                }
            }
        }
    }
    
    var liveValues = {
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
            "imagesPreviouslyDisplayed": []     // Store images previously displayed. 
                                                // Used for displaying images in offline mode.
        },
        "screens": {
            "feedsList": {
                "opened": false                 // Slide right or left entries screen
            }
        },
        "animations": {
            "inProgress": false                 // Set to "true" when user click on elements with "_startAnimation_" class.
        }
    }
    
    var keywords = [];

    var _entriesUpdateInterval = '';
    
    var _dspEntriesTimeout = '';
    
    var _loginInProgress = {"local": false, "feedly": false, "theoldreader": false, "aolreader": false, "tinytinyrss": false}

    // Network Connection

    var _onLine = "NA";
    
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
            
            _saveParams();
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
                
                if ((!navigator.onLine) && (_tokenIsExpired)) {
                    _disableAccount('feedly');
                }
                    
                if (navigator.onLine) {
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
        
        // Get and set The Old Reader token from cache 
        // then try to update token
        // then try to update subscriptions.
        
        if (params.accounts.theoldreader.logged) {
            my._load('cache/theoldreader/access_token.json').then(function(_token){
            
                theoldreader.setToken(_token);
                
                var _now = Math.floor(new Date().getTime() / 1000);
                var _expires_in = _token.expires_in || 604800;
                var _tokenIsExpired = ((_now - _token.lastModified) > _expires_in) ? true : false;
                
                if ((!navigator.onLine) && (_tokenIsExpired)) {
                    _disableAccount('theoldreader');
                }
                    
                if (navigator.onLine) {
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
                
            }).catch(function(error) {
                _disableAccount('theoldreader');
                my.alert(document.webL10n.get("i-cant-reconnect-your-account", {"online-account": "Old Reader"}));
            });
        }
        
        // Get and set Aol Reader token from cache
        // then try to update token
        // then try to update subscriptions.
        
        if (params.accounts.aolreader.logged) {
            my._load('cache/aolreader/access_token.json').then(function(_token){
            
                aolreader.setToken(_token);
                
                var _now = Math.floor(new Date().getTime() / 1000);
                var _expires_in = _token.expires_in || 604800;
                var _tokenIsExpired = ((_now - _token.lastModified) > _expires_in) ? true : false;
                
                if ((!navigator.onLine) && (_tokenIsExpired)) {
                    _disableAccount('aolreader');
                }
                    
                if (navigator.onLine) {
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
        
        if (params.accounts.tinytinyrss.logged) {
            
            // Set server url from "cache/tinytinyrss/params.json"

            my._load("cache/tinytinyrss/params.json").then(function(response){
                tinytinyrss.tinytinyrss.url = response.url;
            }).catch(function(error){
                tinytinyrss.tinytinyrss.url = '';
            }).then(function(){return my._load('cache/tinytinyrss/access_token.json');}).then(function(_token){
                tinytinyrss.setToken(_token);
                
                var _now = Math.floor(new Date().getTime() / 1000);
                var _expires_in = _token.expires_in || 604800;
                var _tokenIsExpired = ((_now - _token.lastModified) > _expires_in) ? true : false;
                
                if ((!navigator.onLine) && (_tokenIsExpired)) {
                    _disableAccount('tinytinyrss');
                }
                    
                if (navigator.onLine) {
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
                
            }).catch(function(error) {
                _disableAccount('tinytinyrss');
                my.alert(document.webL10n.get("i-cant-reconnect-your-account", {"online-account": "Tiny Tiny Rss"}));
            });

        }

        // ---
        
    }).catch(function(error) {
        _saveParams();
    });

    // Load keywords from SDCard.
    // Create file if doesn't exists.

    my._load('keywords.json').then(function(_myKeywords) {
        my.log('loading keywords from file keywords.json ...', _myKeywords);
        keywords = _myKeywords;
    }).catch(function(error) {
        _saveKeywords();
    });

    // ---

    var sortedEntries = [];
    var sortedFeeds = [];

    sync.onclick            = function(event) {
        if (navigator.onLine) {
            ui._vibrate();
            ui._onclick(this, 'disable');
            gf.loadFeeds(params.entries.dontDisplayEntriesOlderThan);
        }
    }

    closeMainEntry.onclick  = function(event) { ui._vibrate(); ui._quickScrollTo(0); ui.echo("browser", "", ""); }

    findFeedsOpen.onclick   = function(event) { ui._vibrate(); ui._scrollTo(-2); }
    findFeedsClose.onclick  = function(event) { ui._vibrate(); ui._scrollTo(-1); }
    
    findFeedsSubmit.onclick = function(event) { 
        ui._vibrate();
        var _keywords = document.getElementById("findFeedsText").value; 
        if (_keywords) {
            ui.echo("find-feeds", "Loading...", ""); 
            gf.findFeeds(_keywords).then(function(results) {
                my.log("Find feed ok", results);
            }).catch(function(error) {
                my.message(document.webL10n.get("find-feeds-error") + JSON.stringify(error));
            });
        }
    }
    
    findFeedsReset.onclick  = function(event) { ui._vibrate(); ui.echo('find-feeds', '', ''); }

    displayGrid.onclick     = function(event) {
        if (params.entries.theme != 'grid') {
            params.entries.theme = "grid";
            ui._vibrate();
            ui.selectThemeIcon();
            dspEntries(gf.getEntries(), params.entries.nbDaysAgo, params.feeds.selectedFeed);
            _saveParams();
        }
    }
    displayCard.onclick     = function(event) {
        if (params.entries.theme != 'card') {
            params.entries.theme = "card";
            ui._vibrate();
            ui.selectThemeIcon();
            dspEntries(gf.getEntries(), params.entries.nbDaysAgo, params.feeds.selectedFeed);
            _saveParams();
        }
    }
    displayList.onclick     = function(event) {
        if (params.entries.theme != 'list') {
            params.entries.theme = "list";
            ui._vibrate();
            ui.selectThemeIcon();
            dspEntries(gf.getEntries(), params.entries.nbDaysAgo, params.feeds.selectedFeed);
            _saveParams();
        }
    }

    /**
     * Show entries matching string and hide others
     * @param {string} string Min length 5 characters or "" to reset display
     * */
    var _search = function(string) {

        if ((string.length > 2) || (string === '')) {
            var _divs = document.querySelectorAll("div.my-list-entry-s, div.my-list-entry-m, div.my-list-entry-l, div.my-grid-entry-s, div.my-grid-entry-m, div.my-grid-entry-l, div.my-card-entry-s, div.my-card-entry-m, div.my-card-entry-l");
            
            _nb = _divs.length;
            
            for (var i = 0; i < _nb; i++) {
                if ((_divs[i].classList.contains("_small_")) && (!params.entries.displaySmallEntries)) {
                    _divs[i].classList.remove('_show');
                    _divs[i].classList.add('_hide');
                } else {
                    //var _text = _divs[i].textContent.toLowerCase(); // v1 Search in complete entries
                    
                    // v3
                    /*
                    var _text = (_divs[i].children)[0].textContent.toLowerCase(); // my-card-theme
                    var _text = (_divs[i].children)[3].textContent.toLowerCase(); // my-list-theme
                    var _text = (_divs[i].children)[0].textContent.toLowerCase(); // my-grid-theme
                    */

                    // v2 Search only in entries titles
                    var _text = "";
                    var childrens = _divs[i].children;
                    for (var j = 0; j < childrens.length; j++) {
                        if (childrens[j].className == 'my-'+params.entries.theme+'-title') {
                            _text = childrens[j].textContent.toLowerCase();
                            break;
                        }
                    }

                    // ---
                    
                    if ((string == '') || (_text.indexOf(string.toLowerCase()) >= 0)) {
                        _divs[i].classList.remove('_hide')
                        _divs[i].classList.add('_show');
                    } else {
                        _divs[i].classList.remove('_show');
                        _divs[i].classList.add('_hide');
                    }
                }
            }
        }
    }
    
    searchEntries.onclick = function(string) {
        
        ui._vibrate();
        
        if (liveValues['entries']['search']['visible'] && document.getElementById('formSearchEntries').classList.contains("_hide")) {
        } else if (liveValues['entries']['search']['visible'] && document.getElementById('formSearchEntries').classList.contains("_show")) {
            liveValues['entries']['search']['visible'] = !liveValues['entries']['search']['visible'];
        } else if (!liveValues['entries']['search']['visible'] && document.getElementById('formSearchEntries').classList.contains("_hide")) {
            liveValues['entries']['search']['visible'] = !liveValues['entries']['search']['visible'];
        } else if (!liveValues['entries']['search']['visible'] && document.getElementById('formSearchEntries').classList.contains("_show")) {
        }
        
        //liveValues['entries']['search']['visible'] = !liveValues['entries']['search']['visible'];
        
        if (liveValues['entries']['search']['visible']) {
            feeds_entries.style.height = "calc(100% - 17.5rem)";
            searchEntries.classList.remove('enable-fxos-white');
            searchEntries.classList.add('enable-fxos-blue');
            document.getElementById('formSearchEntries').classList.remove('_hide');
            document.getElementById('formSearchEntries').classList.add('_show');
            document.getElementById('inputSearchEntries').focus();
            _search(document.getElementById('inputSearchEntries').value);
        } else {
            feeds_entries.style.height = "calc(100% - 13.5rem)";
            searchEntries.classList.remove('enable-fxos-blue');
            searchEntries.classList.add('enable-fxos-white');
            document.getElementById('formSearchEntries').classList.remove('_show');
            document.getElementById('formSearchEntries').classList.add('_hide');
            _search('');
        }

    }
    
    resetSearchEntries.onclick = function() {
        ui._vibrate();
        _search('');
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
        dspEntries(gf.getEntries(), params.entries.nbDaysAgo, params.feeds.selectedFeed);
        feeds_entries.scrollTop = 0;
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
        dspEntries(gf.getEntries(), params.entries.nbDaysAgo, params.feeds.selectedFeed);
        feeds_entries.scrollTop = 0;
    }
    
    function deleteKeyword(_this) {
        my.log('deleteKeyword() ', arguments);

        var _myKeyword = _this.getAttribute("myKeyword");

        var _confirm = window.confirm(document.webL10n.get('confirm-delete-keyword') + "\n" + _myKeyword);

        if (_confirm) {
            
            ui.fade(_this);

            var _tmp = [];

            // (1) Delete myKeyword from array "keyword"

            for (var i = 0; i < keywords.length; i++) {
                if (keywords[i] != _myKeyword) {
                    _tmp.push(keywords[i]);
                }
            }

            keywords = _tmp.slice();
            
            _saveKeywords();

            // (2) Reload UI

            if ((myFeedsSubscriptions.local.length > 0) ||
                (myFeedsSubscriptions.feedly.length > 0) ||
                (myFeedsSubscriptions.theoldreader.length > 0) || 
                (myFeedsSubscriptions.aolreader.length > 0) ||
                (myFeedsSubscriptions.tinytinyrss.length > 0)
            ){
                gf.loadFeeds(params.entries.dontDisplayEntriesOlderThan);
            } else {
                ui.echo("feeds-list", "", "");
                ui.echo("feeds-entries", "", "");
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
            
            gf.deleteEntries(_account, _feedId);

            // (5) Reload UI

            if ((myFeedsSubscriptions.local.length > 0) ||
                (myFeedsSubscriptions.feedly.length > 0) ||
                (myFeedsSubscriptions.theoldreader.length > 0) || 
                (myFeedsSubscriptions.aolreader.length > 0) ||
                (myFeedsSubscriptions.tinytinyrss.length > 0) 
            ){
                gf.setFeedsSubscriptions(myFeedsSubscriptions);
                gf.loadFeeds(params.entries.dontDisplayEntriesOlderThan);
            } else {
                ui.echo("feeds-list", "", "");
                ui.echo("feeds-entries", "", "");
                ui._onclick(sync, 'disable');
            }
        }
    }

    function findFeedsDisplayResults(event) {
        my.log('findFeedsDisplayResults()', arguments);
        my.log(event);

        if ((event.detail.responseStatus == 200) && (event.detail.responseData.entries.length > 0)) {
            var _results = event.detail.responseData.entries;
            var _htmlResults = "<ul>";

            for (var i = 0 ; i < _results.length; i++) {
                
                // Is feed already in subscriptions ?
                
                var _feedAlreadySubscribed = false;
                
                for (var _account in myFeedsSubscriptions) {
                    for (var j = 0; j < myFeedsSubscriptions[_account].length; j++) {
                        if (_results[i].url == myFeedsSubscriptions[_account][j]["url"]) {
                            _feedAlreadySubscribed = true;
                            break;
                        }
                    }
                }
                
                // ---
                
                if (!_feedAlreadySubscribed) {
                    _htmlResults = _htmlResults + '<li><a><button class="addNewFeed" feedUrl="' + _results[i].url + '" feedId="' + _results[i].url + '" ><span data-icon="add"></span></button><p>' + _results[i].title + '</p><p><time>' + _results[i].url + '</time></p></a></li>';
                } else {
                    _htmlResults = _htmlResults + '<li><a><button class="cantAddNewFeed warning"><span class="fa fa-ban fa-2x"></span></button><p>' + _results[i].title + '</p><p><time>' + _results[i].url + '</time></p><p class="warning">' + document.webL10n.get('feed-already-subscribed') + '</p></a></li>';
                }
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
        } else if (event.detail.responseData.entries.length == 0) {
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

            gf.setFeedsSubscriptions(myFeedsSubscriptions);
            gf.loadFeeds(params.entries.dontDisplayEntriesOlderThan);
            
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
        
        '   <li class="_online_">',
        '       <aside class="icon"><span data-icon="reload"></span></aside>',
        '       <aside class="pack-end"><p class="double">' + _now.toLocaleTimeString(userLocale) + '</p></aside>',
        '       <a href="#"><p class="double"><my data-l10n-id="settings-last-update">' + document.webL10n.get('settings-last-update') + '</my></p></a>',
        '   </li>',

        '   <li class="_online_">',
        '       <aside class="icon"><span data-icon="sync"></span></aside>',
        '       <a>',
        '           <p class="double"><my data-l10n-id="settings-update-every">' + document.webL10n.get('settings-update-every') + '</my></p>',
        '       </a>',
        '       ' + _htmlSelectUpdateEvery,
        '   </li>',



        '   <li>',
        '       <aside class="icon"><span data-icon="sd-card"></span></aside>',
        '       <aside class="pack-end"><button id="saveSubscriptions"><span data-l10n-id="save">' + document.webL10n.get('save') + '</span></button></aside>',
        '       <a><p class="double"><my data-l10n-id="my-subscriptions-opml">' + document.webL10n.get('my-subscriptions-opml') + '</my></p></a>',
        '   </li>',

        '</ul>',
        '</section>',
        
        '<h2 data-l10n-id="settings-news">' + document.webL10n.get('settings-news') + '</h2>',
        '<section data-type="list">',
        '<ul>',
        
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
        '           <p><input id="theoldreaderEmail" required="" placeholder="Email" name="theoldreaderEmail" type="email" value=""></p>',
        '           <p><input id="theoldreaderPasswd" required="" placeholder="Password" name="theoldreaderPasswd" type="password" value=""><p>',
        '       </div>',
        '   </li>',
 
        '   <li class="_online_ _onlineAccount_ ' + (params.settings.proxy.availability.tinytinyrss ? '' : '_proxyNotAvailable_') + '">',
        '       <aside class="icon"><span data-icon="addons"></span></aside>',
        '       <aside class="pack-end"><label class="pack-switch"><input id="tinytinyrssCheckbox" type="checkbox"' + _tinytinyrssAccount + '><span></span></label></aside>',
        '       <a href="#">',
        '           <p class="double">Tiny Tiny Rss</p>',
        '       </a>',
        '       <div id="tinytinyrssForm">',
        '           <p><input id="tinytinyrssUrl" required="" placeholder="Url" name="tinytinyrssUrl" type="text" value=""></p>',
        '           <p><input id="tinytinyrssUser" required="" placeholder="Login" name="tinytinyrssUser" type="text" value=""></p>',
        '           <p><input id="tinytinyrssPasswd" required="" placeholder="Password" name="tinytinyrssPasswd" type="password" value=""><p>',
        '       </div>',
        '   </li>',
        
        '</ul>',
        '</section>',
        
        '<h2 data-l10n-id="user-interface">' + document.webL10n.get('user-interface') + '</h2>',
        '<section data-type="list">',
        '<ul>',
        
        '   <li>',
        '       <aside class="icon"><span data-icon="play-circle"></span></aside>',
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
        '       <aside class="icon"><span data-icon="wifi-4"></span></aside>',
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
        '       <aside class="icon"><span data-icon="wifi-4"></span></aside>',
        '       <aside class="pack-end"><p class="double" id="onLine">NA</p></aside>',
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
        
        '   <li>',
        '       <aside class="icon"><span data-icon="bug"></span></aside>',
        '       <aside class="pack-end">',
        '           <a href="#">',
        '               <p class="double"><button id="TinyTinyRss_getSubscriptions"><span>Tiny Tiny Rss</span></button></p>',
        '           </a>',
        '       </aside>',
        '       <a href="#"><p class="double">Load subscriptions</p></a>',
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
        
        // ============================
        // --- Show developper menu ---
        // ============================
        
        document.getElementById('appVersion').onclick = function(e) {
            params.settings.developper_menu.visible = !params.settings.developper_menu.visible;
            dspSettings();
            my.message('Developper menu : ' + params.settings.developper_menu.visible);
            _saveParams();
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

        document.getElementById('toggleDisplaySmallEntries').onclick = function(e) {
            document.body.dispatchEvent(new CustomEvent('settingsSmallNews.change', {"detail": ""}));
            params.entries.displaySmallEntries = !params.entries.displaySmallEntries;
            _saveParams();
            
            params.entries.displaySmallEntries ?
                ui._smallEntries('show') : ui._smallEntries('hide');
        }

        var _selectUpdateEvery = document.getElementById('selectUpdateEvery');
        _selectUpdateEvery.onchange = function(e) {
            params.entries.updateEvery = _selectUpdateEvery.options[_selectUpdateEvery.selectedIndex].value;
            _saveParams();
        }

        var _selectMaxNbDays = document.getElementById('selectMaxNbDays');
        _selectMaxNbDays.onchange = function(e) {
            params.entries.dontDisplayEntriesOlderThan = _selectMaxNbDays.options[_selectMaxNbDays.selectedIndex].value;
            
            if (params.entries.nbDaysAgo >= params.entries.dontDisplayEntriesOlderThan) {
                params.entries.nbDaysAgo = params.entries.dontDisplayEntriesOlderThan;
                ui._onclick(nextDay, 'enable');         // [<]
                ui._onclick(previousDay, 'disable');    // [>]
                feeds_entries.scrollTop = 0;
                dspEntries(gf.getEntries(), params.entries.nbDaysAgo, params.feeds.selectedFeed);
            }
            
            if (params.entries.nbDaysAgo < params.entries.dontDisplayEntriesOlderThan) {
                ui._onclick(previousDay, 'enable');     // [>]
            }
            
            _saveParams();
        }
        
        // UI select language

        var _selectLanguage = document.getElementById('selectLanguage');
        _selectLanguage.onchange = function(e) {
            params.settings.ui.language = _selectLanguage.options[_selectLanguage.selectedIndex].value;
            _saveParams();
            document.webL10n.setLanguage(params.settings.ui.language, "");
            //dspEntries(gf.getEntries(), params.entries.nbDaysAgo, params.feeds.selectedFeed);
            //gf.loadFeeds(params.entries.dontDisplayEntriesOlderThan);
        }
        
        // UI vibrate

        document.getElementById("toggleVibrate").onclick = function() {
            params.settings.ui.vibrate = !params.settings.ui.vibrate;
            _saveParams();
        }
        
        // UI animations checkbox

        document.getElementById("useAnimations").onclick = function() {
            params.settings.ui.animations = !params.settings.ui.animations;
            _saveParams();
        }
        
        // UI proxy checkbox

        document.getElementById("useProxy").onclick = function() {
            params.settings.proxy.use = !params.settings.proxy.use;
            _saveParams();
            ui.toggleProxy();
        }
        
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
                        gf.setFeedsSubscriptions(myFeedsSubscriptions);
                        gf.loadFeeds(params.entries.dontDisplayEntriesOlderThan);
                    }
                ).catch(function(error) {
                    my.message(document.webL10n.get('error-cant-load-local-subscriptions') + JSON.stringify(error));
                });
            }
        }*/
        
        // Load subscriptions Tiny Tiny RSS
        
        document.getElementById("TinyTinyRss_getSubscriptions").onclick = function(event) {
            tinytinyrss.getSubscriptions();
        } 

        // Save subscriptions

        document.getElementById("saveSubscriptions").onclick = function(event) {
            if (window.confirm(document.webL10n.get('confirm-save-subscriptions'))) {
                my.export('opml', true);
            }
        }
        
        // Logs console checkbox

        document.getElementById("logsConsole").onclick = function() {
            params.settings.developper_menu.logs.console = !params.settings.developper_menu.logs.console;
            _saveParams();
        }
        
        // Logs console screen

        document.getElementById("logsScreen").onclick = function() {
            params.settings.developper_menu.logs.screen = !params.settings.developper_menu.logs.screen;
            _saveParams();
        }

        // Feedly checkbox

        document.getElementById('feedlyLogin').onclick = function() {
            if (this.checked) {
                this.checked = false; // False until CustomEvent Feedly.login.done
                feedly.login();
            } else {
                params.accounts.feedly.logged = false;
                _disableAccount('feedly');
                gf.loadFeeds(params.entries.dontDisplayEntriesOlderThan);
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
                gf.loadFeeds(params.entries.dontDisplayEntriesOlderThan);
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
                gf.loadFeeds(params.entries.dontDisplayEntriesOlderThan);
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
                gf.loadFeeds(params.entries.dontDisplayEntriesOlderThan);
                document.getElementById('tinytinyrssForm').style.cssText = 'display: block';
            }
        }        
        
        // =========================
        // --- App start offline ---
        // =========================
        
        if (!navigator.onLine) {
            ui._disable();
        }

        // ---

        var end = performance.now();
        my.log("dspSettings() " + (end - start) + " milliseconds.");
    }

    function dspFeeds(feeds) {
        var start = performance.now();
        
        my.log('dspFeeds()', arguments);
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
            
            _htmlKeywords = _htmlKeywords + '<h2 data-l10n-id="search-by-keywords">' + document.webL10n.get('search-by-keywords') + '</h2><ul class="keywords">';
            
            for (var i = 0; i < _sortedKeywords.length; i++) {
                var _count = count(_sortedKeywords[i]);
                var _deleteIcone = '<button class="deleteKeyword" myKeyword="' + _sortedKeywords[i] + '"><span data-icon="delete"></span></button>';
                _htmlKeywords = _htmlKeywords + '<li><a class="openKeyword" myKeyword="' +  _sortedKeywords[i] + '"><p>' + _deleteIcone + '<button><span data-icon="search"></span></button><count class="count">'+_count+'</count>' + _sortedKeywords[i] + '</p></a></li>';
            }
            
            _htmlKeywords = _htmlKeywords + '</ul>';
        }
        
        // ==========================
        // --- Display feeds list ---
        // ==========================

        for (var i = 0; i < feeds.length; i++) {
            var _feed = feeds[i];
            var _account = _feed._myAccount;
            var _deleteIcone = '';

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
                    
                _deleteIcone = '<button class="' + _class + '" account="' + _account + '" feedId="' + _feed._myFeedId + '"><span data-icon="delete"></span></button>';
            }

            var _myLastPublishedDate = (_feed._myLastTimestamp == 0) ? "No news" : _feed._myLastPublishedDate;

            _html[_account] = _html[_account] + '<li><a class="open" feedUrl="' + _feed.feedUrl + '"><p>' + _deleteIcone + '<button><span data-icon="' + _feed._myPulsationsIcone + '"></span></button>' + _feed.title + '</p><p><time>' + _myLastPublishedDate + '</time></p></a></li>';
        }

        _htmlFeeds = _htmlFeeds +
            '<ul>' +
            '<li><a class="open" feedUrl=""><p><button><span data-icon="forward"></span></button><my data-l10n-id="all-feeds">' + document.webL10n.get('all-feeds') + '</my></p></a></li>' +
            '</ul>' +
            '' + _htmlKeywords;
        
        for (var _account in _html) {
            if (_html[_account] != "") {
                _htmlFeeds = _htmlFeeds + '<h2>' + params.accounts[_account].title + '</h2><ul class="' + _account + '">' + _html[_account] + '</ul>';
            }
        }
        
        // --- Display ---

        ui.echo("feeds-list", _htmlFeeds, "");
        
        // ===========================
        // --- Add Events keywords ---
        // ===========================
        
        // onclick delete keyword :

        var _deletes = document.querySelectorAll(".deleteKeyword");

        for (var i = 0; i < _deletes.length; i++) {
            _deletes[i].onclick = function(e) {
                ui._vibrate();
                e.stopPropagation();
                e.preventDefault();
                deleteKeyword(this);
            }
        }
        
        // onclick open keyword :

        var _opens = document.querySelectorAll(".openKeyword");

        for (var i = 0; i < _opens.length; i++) {
            _opens[i].onclick = function() {
                liveValues['entries']['search']['visible'] = true;
                ui._vibrate();
                ui._scrollTo(0);
                ui._onclick(nextDay, 'disable');
                ui._onclick(previousDay, 'enable');
                params.entries.nbDaysAgo = 0;
                params.feeds.selectedFeed = "";
                document.getElementById('inputSearchEntries').value = this.getAttribute("myKeyword");
                dspEntries(gf.getEntries(), params.entries.nbDaysAgo, params.feeds.selectedFeed);
            }
        }

        // ========================
        // --- Add Events Feeds ---
        // ========================

        // onclick delete button :

        var _deletes = document.querySelectorAll(".delete");

        for (var i = 0; i < _deletes.length; i++) {
            _deletes[i].onclick = function(e) {
                ui._vibrate();
                e.stopPropagation();
                e.preventDefault();
                deleteFeed(this);
            }
        }

        // onclick open feed :

        var _opens = document.querySelectorAll(".open");

        for (var i = 0; i < _opens.length; i++) {
            _opens[i].onclick = function() {
                liveValues['entries']['search']['visible'] = false;
                document.getElementById('inputSearchEntries').value = "";
                ui._vibrate();
                ui._scrollTo(0);
                ui._onclick(nextDay, 'disable');
                ui._onclick(previousDay, 'enable');
                params.entries.nbDaysAgo = 0;
                params.feeds.selectedFeed = this.getAttribute("feedUrl");
                _saveParams();
                dspEntries(gf.getEntries(), params.entries.nbDaysAgo, params.feeds.selectedFeed);
            }
        }
        
        // =========================
        // --- App start offline ---
        // =========================

        if (!navigator.onLine) {
            ui._disable();
        }
        
        var end = performance.now();
        my.log("dspFeeds() " + (end - start) + " milliseconds.");
    }

    function dspEntries(entries, nbDaysAgo, feedUrl) {

        var feedsEntriesScrollTop = feeds_entries.scrollTop;
        
        ui.echo('feedsEntriesNbDaysAgo', document.webL10n.get('loading'), '');
        ui.echo('feeds-entries', '', '');
        
        clearTimeout(_dspEntriesTimeout);
        
        _dspEntriesTimeout = window.setTimeout(function() {

            var start = performance.now();
            
            my.log("dspEntries()", arguments);
            my.log(entries);

            sortedEntries = entries;

            _setTimestamps();

            var _timestampMin = liveValues['timestamps']['max'] - (86400 * nbDaysAgo) - 86400 + 1;
            var _timestampMax = liveValues['timestamps']['max'] - (86400 * nbDaysAgo);
            
            my.log("dspEntries() beetween " + _timestampMin + " (00:00:00) & " + _timestampMax + " (23:59:59)");

            var _previousDaysAgo    = -1; // Count days to groups entries by day.
            var _entrieNbDaysAgo    = 0;

            var _nbEntriesDisplayed = {'small': 0, 'large': 0};

            // =======================
            // --- Display entries ---
            // =======================

            var _htmlEntries = "";
            var _htmlFeedTitle = "";
            var _firstEntrie = true;
            var _theme = params.entries.theme;
            
            var _nb = sortedEntries.length;

            for (var i = 0; i < _nb; i++) {

                // Get entries of specific feed or get all entries.

                var _entrie = "";

                if ((feedUrl !== "") && (feedUrl == sortedEntries[i]._myFeedInformations.feedUrl)) {
                    var _entrie = sortedEntries[i];
                    if (_firstEntrie) {
                        _htmlFeedTitle = _htmlFeedTitle + '<h2>' + _entrie._myFeedInformations.title + '</h2>'; // Specific feed title
                        _firstEntrie = false;
                    }
                } else if (feedUrl == "") {
                    var _entrie = sortedEntries[i];
                }

                // ---

                if ((_entrie._myTimestamp >= _timestampMin) && (_entrie._myTimestamp < _timestampMax)) {

                        // Time
                        
                        var _time = _entrie._myLocalizedTime;

                        // Small article or not ?

                        var _isSmallEntry = my.isSmallEntry(_entrie);

                        // 1st image

                        var _imageUrl = "";
                        
                        // Try to detect broken image
                        /*var _img = new Image(); 
                        _img.src = _entrie._myFirstImageUrl; 

                        if (!_img.complete) {
                            _entrie._myFirstImageUrl = "";
                        }*/

                        if (_entrie._myFirstImageUrl) {
                            if (_isSmallEntry) {
                                _imageUrl = '<span class="my-'+_theme+'-image-container '+_theme+'-ratio-image-s"><img src="images/loading.png" data-src="' + _entrie._myFirstImageUrl + '"/></span>';
                            } else {
                                _imageUrl = '<span class="my-'+_theme+'-image-container '+_theme+'-ratio-image-l"><img src="images/loading.png" data-src="' + _entrie._myFirstImageUrl + '"/></span>';
                            }
                        }

                        // Entry class ratio ?

                        var _ratioClass = _theme + '-ratio-entry-l';

                        if (_isSmallEntry && (!_entrie._myFirstImageUrl)) {
                            _ratioClass = _theme + '-ratio-entry-s';
                        }

                        else if (_isSmallEntry || (!_entrie._myFirstImageUrl)) {
                            _ratioClass = _theme + '-ratio-entry-m';
                        }

                        // Account icone ?

                        var _accountIcone = '';

                        if (_entrie._myFeedInformations._myAccount != 'local') {
                            _accountIcone = '<img src="images/' + _entrie._myFeedInformations._myAccount + '.' + _theme + '.png" data-src="images/' + _entrie._myFeedInformations._myAccount + '.' + _theme + '.png" />';
                        }

                        // Content ( Normal / Small )

                        var _content = "";

                        if ((params.entries.theme == 'list') && (!_isSmallEntry)) {
                            _content = _content + '<div class="my-'+_theme+'-entry-l ' + _ratioClass + '" i="' + i + '">';
                            _content = _content + '<span class="my-'+_theme+'-feed-title">' + _entrie._myFeedInformations.title + '</span>';
                            _content = _content + '<span class="my-'+_theme+'-date" publishedDate="' + _entrie.publishedDate + '">' + _time + '</span>';
                            _content = _content + '<div class="my-'+_theme+'-image-wrapper">' + _imageUrl + '</div>';
                            _content = _content + '<span class="my-'+_theme+'-title">' + _accountIcone + _entrie.title + '</span>';
                            _content = _content + '<span class="my-'+_theme+'-snippet">' + _entrie.contentSnippet + '</span>';
                            _content = _content + '<div class="my-'+_theme+'-footer"></div>';
                            _content = _content + '</div>';

                            _nbEntriesDisplayed['large']++;

                        } else if (params.entries.theme == 'list') {
                            _content = _content + '<div class="_online_ _small_ my-'+_theme+'-entry-s ' + _ratioClass + '" i="' + i + '" entry_link="' + _entrie.link + '">';
                            _content = _content + '<span class="my-'+_theme+'-feed-title">' + _entrie._myFeedInformations.title + '</span>';
                            _content = _content + '<span class="my-'+_theme+'-date" publishedDate="' + _entrie.publishedDate + '">' + _time + '</span>';
                            _content = _content + '<div class="my-'+_theme+'-image-wrapper">' + _imageUrl + '</div>';
                            _content = _content + '<span class="my-'+_theme+'-title">' + _accountIcone + _entrie.title + '</span>';
                            _content = _content + '<span class="my-'+_theme+'-snippet">' + _entrie.contentSnippet + '</span>';
                            _content = _content + '<div class="my-'+_theme+'-footer"></div>';
                            _content = _content + '</div>';

                            _nbEntriesDisplayed['small']++;

                        } else if (!_isSmallEntry) {
                            _content = _content + '<div class="my-'+_theme+'-entry-l ' + _ratioClass + '" i="' + i + '">';
                            _content = _content + '<span class="my-'+_theme+'-title">' + _accountIcone + _entrie.title + '</span>';
                            _content = _content + '<span class="my-'+_theme+'-feed-title">' + _entrie._myFeedInformations.title + '</span>';
                            _content = _content + _imageUrl;
                            _content = _content + '<span class="my-'+_theme+'-date" publishedDate="' + _entrie.publishedDate + '">' + _time + '</span>';
                            _content = _content + '<span class="my-'+_theme+'-snippet">' + _entrie.contentSnippet + '</span>';
                            _content = _content + '</div>';

                            _nbEntriesDisplayed['large']++;

                        } else {
                            _content = _content + '<div class="_online_ _small_ my-'+_theme+'-entry-s ' + _ratioClass + '" i="' + i + '" entry_link="' + _entrie.link + '">';
                            _content = _content + '<span class="my-'+_theme+'-title">' + _accountIcone + _entrie.title + '</span>';
                            _content = _content + '<span class="my-'+_theme+'-feed-title">' + _entrie._myFeedInformations.title + '</span>';
                            _content = _content + _imageUrl;
                            _content = _content + '<span class="my-'+_theme+'-date" publishedDate="' + _entrie.publishedDate + '">' + _time + '</span>';
                            _content = _content + '</div>';

                            _nbEntriesDisplayed['small']++;
                        }

                        // Add to html entries

                        _htmlEntries = _htmlEntries + _content;

                } else if ((_nbEntriesDisplayed['small'] + _nbEntriesDisplayed['large']) > 0) { break; }
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

            // Display entries:
            
            if (params.entries.displaySmallEntries && ((_nbEntriesDisplayed['small'] + _nbEntriesDisplayed['large']) > 0)) {
                ui.echo("feeds-entries", _htmlFeedTitle + _htmlEntries, "");
            } else if (!params.entries.displaySmallEntries && (_nbEntriesDisplayed['large'] > 0)) {
                ui.echo("feeds-entries", _htmlFeedTitle + _htmlEntries, "");
            } else if (!params.entries.displaySmallEntries && (_nbEntriesDisplayed['large'] == 0)) {
                ui.echo("feeds-entries", _htmlFeedTitle + '<div class="notification" data-l10n-id="no-news-today">' + document.webL10n.get('no-news-today') + '</div>', "");
            } else if ((_nbEntriesDisplayed['small'] + _nbEntriesDisplayed['large']) == 0) {
                ui.echo("feeds-entries", _htmlFeedTitle + '<div class="notification" data-l10n-id="no-news-today">' + document.webL10n.get('no-news-today') + '</div>', "");
            } else {
                ui.echo("feeds-entries", _htmlFeedTitle + '<div class="notification" data-l10n-id="error-no-network-connection">' + document.webL10n.get('error-no-network-connection') + '</div>', "");
            } 
            
            // Hide/show small entries:
            
            params.entries.displaySmallEntries ?
                ui._smallEntries('show') : ui._smallEntries('hide');

            // Scroll if you stay in same day.
            
            if (_previousNbDaysAgo == nbDaysAgo) {
                feeds_entries.scrollTop = feedsEntriesScrollTop;
            }
            
            _previousNbDaysAgo = nbDaysAgo;
            
            // ==================
            // --- Add Events ---
            // ==================

            // onclick Small Entries:

            var _small_entries = document.querySelectorAll(".my-"+_theme+"-entry-s");
            
            _nb = _small_entries.length;

            for (var i = 0; i < _nb; i++) {
                _small_entries[i].onclick = function() {
                    ui._vibrate(); 
                    ui.fade(this);
                    liveValues.screens.feedsList.opened = false; 
                    mainEntryOpenInBrowser(this.getAttribute("i"), this.getAttribute("entry_link")); 
                }
            }

            // onclick Normal Entries :

            var _entries = document.querySelectorAll(".my-"+_theme+"-entry-l");

            _nb = _entries.length;

            for (var i = 0; i < _nb; i++) {
                _entries[i].onclick = function() { 
                    ui._vibrate(); 
                    ui.fade(this);
                    liveValues.screens.feedsList.opened = false;
                    mainEntryOpenInBrowser(this.getAttribute("i"), ""); 
                }
            }
            
            // =========================
            // --- App start offline ---
            // =========================
            
            if (!navigator.onLine) {
                ui._disable();
            }
            
            document.body.dispatchEvent(new CustomEvent('dspEntries.done', {"detail": ""}));
        
            // --- Eecution time
            
            var end = performance.now();
            my.log("dspEntries() " + (end - start) + " milliseconds.");
        
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
     * @param {null}
     * @return {null}
     * */
    function setEntriesIds() {
        my.log('setEntriesIds()');

        // ID max
        
        _setTimestamps();

        var _nb     = sortedEntries.length - 1;
        var _string = document.getElementById('inputSearchEntries').value || "";

        while ((sortedEntries[_nb]._myTimestamp < liveValues['timestamps']['min'])
            || (!params.entries.displaySmallEntries && my.isSmallEntry(sortedEntries[_nb]))
            || (_string !== "" && liveValues['entries']['search']['visible'] && (((sortedEntries[_nb].title).toLowerCase()).indexOf(_string.toLowerCase()) == -1))
        ){
            _nb = _nb - 1;
            if (_nb < 0) { break; }
        }
        
        my.log('setEntriesIds() entries = ', sortedEntries);
        my.log('setEntriesIds() search = ' + _string);
        my.log('setEntriesIds() result = ', sortedEntries[_nb]);
        
        liveValues['entries']['id']['max'] = _nb;
        
        // ID min

        my.log('setEntriesIds()');
        
        var _nb     = 0;
        var _string = document.getElementById('inputSearchEntries').value || "";

        while ((sortedEntries[_nb]._myTimestamp > liveValues['timestamps']['max'])
            || ((params.entries.displaySmallEntries == false) && (my.isSmallEntry(sortedEntries[_nb]) == true)) 
            || (_string !== "" && liveValues['entries']['search']['visible'] && (((sortedEntries[_nb].title).toLowerCase()).indexOf(_string.toLowerCase()) == -1))
        ){
            _nb = _nb + 1;
            if (_nb >= sortedEntries.length) { break; }
        }
        
        my.log('setEntriesIds() entries = ', sortedEntries);
        my.log('setEntriesIds() search = ' + _string);
        my.log('setEntriesIds() result = ', sortedEntries[_nb]);
        
        liveValues['entries']['id']['min'] = _nb;
    }

    /**
     * @param {int} entryId
     * @param {string} url
     * @return {CustomEvent} mainEntryOpen.done
     * */
    function mainEntryOpenInBrowser(entryId, url) {
        my.log('mainEntryOpenInBrowser()', arguments);
        document.body.style.cssText = "overflow: hidden;";  // Disable scroll in entries list.
        
        share.setAttribute("_mySha256_link", sortedEntries[entryId]['_mySha256_link']);
        share.setAttribute("_mySha256_title", sortedEntries[entryId]['_mySha256_title']);

        if (url != "" ) {
            ui.echo("browser", '<iframe src="' + url + '" sandbox="allow-same-origin allow-scripts" mozbrowser remote></iframe>', "");
        } else {
            var _entry = sortedEntries[entryId];
            var _srcDoc = "";
            var _regex = new RegExp('\'', 'g');
            var _author = "";
            
            //my.log('mainEntryOpenInBrowser()', _entry.content);

            if (_entry.author !== "") {
                _author = '<div class="entrie-author"><my data-l10n-id="by">' + document.webL10n.get('by') + '</my> ' + _entry.author + '</div>';
            }

            _srcDoc = _srcDoc + _srcDocCss; // Inline CSS from file "style/inline.css.js"
            _srcDoc = _srcDoc + '<div class="entrie-title">' + _entry.title.replace(_regex, "&#39;") + '</div>';
            _srcDoc = _srcDoc + '<div class="entrie-date">' + new Date(_entry.publishedDate).toLocaleString(userLocale) + '</div>';
            _srcDoc = _srcDoc + _author;
            _srcDoc = _srcDoc + '<div class="entrie-feed-title"><a href="' + _entry._myFeedInformations.link + '">' + _entry._myFeedInformations.title.replace(_regex, "&#39;") + '</a></div>';
            _srcDoc = _srcDoc + '<div class="entrie-contentSnippet">' + _entry.content.replace(_regex, "&#39;") + '</div>';
            _srcDoc = _srcDoc + '<div class="entrie-visit-website"><a href="' + _entry.link + '"><my data-l10n-id="entry-visit-website">' + document.webL10n.get('entry-visit-website') + '</my></a></div>';

            ui.echo("browser", '<iframe srcdoc=\'' + _srcDoc + '\' sandbox="allow-same-origin allow-scripts" mozbrowser remote></iframe>', "");
        }

        document.getElementById("browser").style.cssText = "display: block;";

        main_entry.scrollTop = 0;
        
        document.body.dispatchEvent(new CustomEvent('mainEntryOpen.done', {"detail": {"entryId": entryId, "url": url, "_mySha256_link": sortedEntries[entryId]['_mySha256_link'], "_mySha256_title": sortedEntries[entryId]['_mySha256_title']}}));

        ui._quickScrollTo(1);
    }

    /**
     * @param {null}
     * Update feeds pulsations once all feeds are loaded.
     * */
    function updateFeedsPulsations() {
        var _tmp = [];
        var _feeds = gf.getFeeds();
        var _pulsations;
        var _feed = '';

        for (var _account in myFeedsSubscriptions) {

            for (var i = 0 ; i < myFeedsSubscriptions[_account].length; i++) {

                for (var j = 0 ; j < _feeds.length; j++) {

                    if (myFeedsSubscriptions[_account][i].url == _feeds[j].feedUrl) {

                        _url        = _feeds[j].feedUrl;
                        _pulsations = _feeds[j]._myPulsations;
                        _account    = _feeds[j]._myAccount; // test

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
     * Variable "liveValues['timestamps']['max']" Start of day timestamp. 
     * Variable "liveValues['timestamps']['min']" Value beyond which an entry can't be displayed. (Too old)
     * @param {null}
     * */
    function _setTimestamps() {
        var _now    = new Date();
        var _year   = _now.getFullYear();
        var _month  = _now.getMonth();
        var _day    = _now.getDate();

        var _myDate = new Date(_year, _month, _day, '23','59','59');
        
        liveValues['timestamps']['max'] = Math.floor(_myDate.getTime() / 1000);

        liveValues['timestamps']['min'] = liveValues['timestamps']['max'] - (86400 * params.entries.dontDisplayEntriesOlderThan) - 86400 + 1;
    }

    // Callback for ALL subscriptions promises
    // 1st feeds loading.

    function initAndLoadFeeds(subscriptions) {
        my.log('initAndLoadFeeds()', arguments);

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

        if (_nbFeedsSubscriptions == 0) {
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

                my._save("subscriptions.local.json", "application/json", JSON.stringify(myFeedsSubscriptions.local)).then(function(results) {
                    my.log('Save file subscriptions.local.json');
                }).catch(function(error) {
                    my.error("ERROR saving file ", error);
                    my.alert("ERROR saving file " + error.filename);
                });
            }
        }

        // 1st feeds loading

        my.log('========================');
        my.log(myFeedsSubscriptions);
        my.log('========================');

        if (_nbFeedsSubscriptions > 0) {
            gf.setFeedsSubscriptions(myFeedsSubscriptions);
            gf.loadFeeds(params.entries.dontDisplayEntriesOlderThan);
        }

        // ---

        dspSettings();
    }

    function _saveParams() {
        var _nbDaysAgo = params.entries.nbDaysAgo;
        params.entries.nbDaysAgo = 0;   // Reset nbDaysAgo value before saving file.
                                        // Reset affect "params" object !!!!!
        my._save("params.json", "application/json", JSON.stringify(params)).then(function(results) {
            my.log("Save file params.json");
        }).catch(function(error) {
            my.error("ERROR saving file params.json", error);
            my.alert('ERROR saving file params.json');
        });
        params.entries.nbDaysAgo = _nbDaysAgo;
    }

    function _saveKeywords() {
        my._save("keywords.json", "application/json", JSON.stringify(keywords)).then(function(results) {
            my.log("Save file keywords.json");
        }).catch(function(error) {
            my.error("ERROR saving file keywords.json", error);
            my.alert('ERROR saving file keywords.json');
        });
    }
    
    /**
     * Disable online account
     * @param {string} feedly, theoldreader, aolreader, tinytinyrss
     * */
    function _disableAccount(_account) {
        my.log('_disableAccount', arguments);
        params.accounts[_account].logged = false
        myFeedsSubscriptions[_account] = [];
        gf.setFeedsSubscriptions(myFeedsSubscriptions);
        gf.deleteEntries(_account, '');
        _saveParams();
     }

    /**
     * Add new feeds in array myFeedsSubscriptions
     * if feeds doesn't exists in array.
     * @param {_feeds} array
     * */
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
     * */
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
     * */
    function count(keyword){
        var out = 0;
        
        entries = gf.getEntries();

        var _nb = entries.length;
        var _regex = new RegExp(keyword, "gi");

        for (var i = 0; i < _nb; i++) {
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

        _swipe("");

        // Promises V1

        var promise1 = my._load('subscriptions.local.json').then(function(results) {return results;}
        ).catch(function(error) {_disableAccount('local'); return {};});

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
            ).catch(function(error) {params.accounts[_account].logged = false; _saveParams(); return {};});
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

        // ===============================================
        // --- Network connection : online / offline ? ---
        // ===============================================

        setInterval(function() {
            if (_onLine != navigator.onLine) {
                var _status = navigator.onLine == true ? 'enable' : 'disable';

                document.body.dispatchEvent(new CustomEvent('networkConnection.change', {"detail": _onLine}));

                ui.toggle(_status);

                // Store current connection status

                _onLine = navigator.onLine;

                // ---
            }
        }, 5000);
        
        // ======================
        // --- Memory cleanup ---
        // ======================
        
        // Remove old entries
        
        setInterval(function() {
            var _maxNbDaysAgo = params.settings.days.last();
            var _timestampMax = liveValues['timestamps']['max'] - (86400 * _maxNbDaysAgo);
            gf.deleteOldEntries(_timestampMax);
        }, 60000);
        
        // =============================================
        // --- Load visibles images & localize times ---
        // =============================================
        
        setInterval(function() {
            if (!liveValues.animations.inProgress) {
                ui.loadImages();
                localizeTimes();
            }
        }, 500);

        // ==============
        // --- Events ---
        // ==============

        browser.addEventListener('mozbrowsererror', function (event) {
            console.dir("Moz Browser loading error : " + event.detail);
        });
        
        // Keyboard
        
        window.addEventListener("keydown", function (event) {
            if (event.keyCode == 13) {
                if (document.activeElement.id == "inputSearchEntries") {
                    event.stopPropagation();
                    event.preventDefault();
                    document.getElementById('inputSearchEntries').blur(); // Remove focus
                    _search(document.activeElement.value);
                }
            }
        }, true);
        
        // Set the 'lang' and 'dir' attributes to <html> when the page is translated
        
        window.addEventListener('localized', function() {
            document.documentElement.lang = document.webL10n.getLanguage();
            document.documentElement.dir = document.webL10n.getDirection();
        }, false);

        // Automatic update entries every N seconds :

        var _startInterval = performance.now();
        
        _entriesUpdateInterval = window.setInterval(function() {
            var _nowInterval = performance.now();
            if (navigator.onLine && ((_nowInterval - _startInterval) >= (params.entries.updateEvery * 1000))) {
                _startInterval = _nowInterval;
                ui._onclick(sync, 'disable');
                gf.loadFeeds(params.entries.dontDisplayEntriesOlderThan);
            }
        }, 59000); // 59s Less than minimal Firefox OS sleep time (60s)
        
        // Main entry open done...
        // Update next entry [<] & previous entry [>] buttons.
        // Update next & previous entries titles
        
        document.body.addEventListener('mainEntryOpen.done', function(event){
            
            setEntriesIds(); // Set values liveValues['entries']['id']['max'] & liveValues['entries']['id']['min']
            
            var _entryId = 0;
            var _mySha256_title = event.detail["_mySha256_title"];
            var _mySha256_link  = event.detail["_mySha256_link"];
            var _nb = sortedEntries.length;
            var _string = document.getElementById('inputSearchEntries').value || "";

            for (var i = 0; i < _nb; i++) {
                if ((sortedEntries[i]['_mySha256_title']== _mySha256_title) ||
                    (sortedEntries[i]['_mySha256_link'] == _mySha256_link)) {

                    var _entryId = i;
                    var _previousEntryId = i + 1;
                    var _nextEntryId = i - 1;

                    // [>] previous news ?
                    
                    if (_previousEntryId > liveValues['entries']['id']['max']) {
                        _previousEntryId = _entryId;
                    } else {
                        var _content = (sortedEntries[_previousEntryId]._myFeedInformations.title + ' ' + sortedEntries[_previousEntryId].title + ' ' + sortedEntries[_previousEntryId].contentSnippet).toLowerCase();
                        
                        while ((sortedEntries[_previousEntryId]._myTimestamp < liveValues['timestamps']['min'])
                            || (!params.entries.displaySmallEntries && my.isSmallEntry(sortedEntries[_previousEntryId]))
                            || (_string !== "" && liveValues['entries']['search']['visible'] && (_content.indexOf(_string.toLowerCase()) == -1))
                        ){
                            _previousEntryId = _previousEntryId + 1;
                            if (_previousEntryId > liveValues['entries']['id']['max']) { _previousEntryId = _entryId; break; }
                            _content = (sortedEntries[_previousEntryId]._myFeedInformations.title + ' ' + sortedEntries[_previousEntryId].title + ' ' + sortedEntries[_previousEntryId].contentSnippet).toLowerCase();
                        }
                    }
                
                    // [<] next news ?
                    
                    if (_nextEntryId < 0) {
                        _nextEntryId = _entryId; 
                    } else {
                        var _content = (sortedEntries[_nextEntryId]._myFeedInformations.title + ' ' + sortedEntries[_nextEntryId].title + ' ' + sortedEntries[_nextEntryId].contentSnippet).toLowerCase();
                        
                        while ((sortedEntries[_nextEntryId]._myTimestamp > liveValues['timestamps']['max'])
                            || (!params.entries.displaySmallEntries && my.isSmallEntry(sortedEntries[_nextEntryId]))
                            || (_string !== "" && liveValues['entries']['search']['visible'] && (_content.indexOf(_string.toLowerCase()) == -1))
                        ){
                            _nextEntryId = _nextEntryId - 1;
                            if (_nextEntryId < 0) {_nextEntryId = _entryId; break; }
                            _content = (sortedEntries[_nextEntryId]._myFeedInformations.title + ' ' + sortedEntries[_nextEntryId].title + ' ' + sortedEntries[_nextEntryId].contentSnippet).toLowerCase();
                        }
                    }
                    
                    break;
                }
            }
            
            //my.message(_nextEntryId+ ' [<] '+ _entryId +' [>]' +_previousEntryId);

            // [<]
            
            if (my.isSmallEntry(sortedEntries[_nextEntryId])) {
                dom['entry']['next']['button'].setAttribute("i", _nextEntryId);
                dom['entry']['next']['button'].setAttribute("entry_link", sortedEntries[_nextEntryId].link);
            } else {
                dom['entry']['next']['button'].setAttribute("i", _nextEntryId);
                dom['entry']['next']['button'].setAttribute("entry_link", "");
            }
            
            // [>]
            
            if (my.isSmallEntry(sortedEntries[_previousEntryId])) {
                dom['entry']['previous']['button'].setAttribute("i", _previousEntryId);
                dom['entry']['previous']['button'].setAttribute("entry_link", sortedEntries[_previousEntryId].link);
            } else {
                dom['entry']['previous']['button'].setAttribute("i", _previousEntryId);
                dom['entry']['previous']['button'].setAttribute("entry_link", "");
            }
            
            // Disable / enable button [<]

            if ((_nextEntryId < liveValues['entries']['id']['min']) || (_nextEntryId == _entryId)) {
                ui._onclick(dom['entry']['next']['button'], 'disable');
                ui.echo("nextEntryTitle", "", "");
            } else {
                ui._onclick(dom['entry']['next']['button'], 'enable');
                ui.echo("nextEntryTitle", sortedEntries[_nextEntryId].title, "");
            }
            
            // Disable / enable button [>]
            
            if ((_previousEntryId > liveValues['entries']['id']['max']) || (_previousEntryId == _entryId)) {
                ui._onclick(dom.entry['previous']['button'], 'disable');
                ui.echo("previousEntryTitle", "", "");
            } else {
                ui._onclick(dom.entry['previous']['button'], 'enable');
                ui.echo("previousEntryTitle", sortedEntries[_previousEntryId].title, "");
            }
            
        });
        
        // ---
        
        dom['entry']['next']['button'].onclick = function() {
            mainEntryOpenInBrowser(this.getAttribute("i"), this.getAttribute("entry_link")); 
        }
        
        dom['entry']['previous']['button'].onclick = function() {
            mainEntryOpenInBrowser(this.getAttribute("i"), this.getAttribute("entry_link")); 
        }
        
        // Share entry :
        // https://developer.mozilla.org/fr/docs/Web/API/Web_Activities

        share.onclick = function() {
            my.log(this);
            ui._vibrate();
            var _entryId = 0;
            var _mySha256_title = this.getAttribute("_mySha256_title");
            var _mySha256_link  = this.getAttribute("_mySha256_link");
            
            for (var i = 0; i < sortedEntries.length; i++) {
                if ((sortedEntries[i]['_mySha256_title']== _mySha256_title) ||
                    (sortedEntries[i]['_mySha256_link'] == _mySha256_link)) {
                    var _entryId = i;
                    break;
                }
            }
            
            var _entry = sortedEntries[_entryId];
            my.log(_entry);
            new MozActivity({
                name: "new",
                data: {
                    type: ["websms/sms", "mail"],
                    number: 0,
                    url: "mailto:?subject=" + encodeURIComponent(_entry.title) + "&body=" + encodeURIComponent(_entry.link),
                    body: _entry.title + "\n" + _entry.link
                }
            });
        };
        
        // Search entries after "dspEntries"
        
        document.body.addEventListener('dspEntries.done', function(event){
            if (liveValues['entries']['search']['visible']) {
                feeds_entries.style.height = "calc(100% - 17.5rem)";
                searchEntries.classList.remove('enable-fxos-white');
                searchEntries.classList.add('enable-fxos-blue');
                document.getElementById('formSearchEntries').classList.remove('_hide');
                document.getElementById('formSearchEntries').classList.add('_show');
                _search(document.getElementById('inputSearchEntries').value);
            }
        });
        
        // Search on input change
        
        document.getElementById('inputSearchEntries').addEventListener('input', function(){
            var _searchString = document.getElementById('inputSearchEntries').value;
            _search(_searchString);
        });
        
        // Add keyword
        
        addKeyword.onclick = function() {
            ui._vibrate();
            var _myKeyword = document.getElementById('inputSearchEntries').value;

            if (_myKeyword.length > 0) {
                var _confirm = window.confirm(document.webL10n.get('confirm-add-keyword') + "\n" + _myKeyword);

                if ((_confirm) && (!keywords.contains(_myKeyword))) {
                    keywords.push(_myKeyword);
                    _saveKeywords();
                    
                    // Reload UI
                    
                    liveValues['entries']['search']['visible'] = true;

                    if ((myFeedsSubscriptions.local.length > 0) ||
                        (myFeedsSubscriptions.feedly.length > 0) ||
                        (myFeedsSubscriptions.theoldreader.length > 0) || 
                        (myFeedsSubscriptions.aolreader.length > 0) || 
                        (myFeedsSubscriptions.tinytinyrss.length > 0)
                    ){
                        gf.loadFeeds(params.entries.dontDisplayEntriesOlderThan);
                    } else {
                        ui.echo("feeds-list", "", "");
                        ui.echo("feeds-entries", "", "");
                        ui._onclick(sync, 'disable');
                    }
                    
                    // Done
                    
                    my.message(document.webL10n.get('keyword-was-added'));
                } else {
                    my.message(document.webL10n.get('keyword-was-not-added'));
                }
            
            }
        }

        /* ===================== */
        /* --- Google Events --- */
        /* ===================== */

        document.body.addEventListener('GoogleFeed.load.done', function(event){

            // Save feed as file

            if (navigator.onLine) {
                my._save('cache/google/feeds/' + btoa(event.detail.responseData.feed.feedUrl) + ".json", "application/json", JSON.stringify(event.detail.responseData.feed)).then(function(results) {
                    my.log('GoogleFeed.load.done > Saving feed in cache ok : ' + event.detail.responseData.feed.feedUrl + ' ('+btoa(event.detail.responseData.feed.feedUrl)+')');
                }).catch(function(error) {
                    my.error("ERROR saving feed in cache : " + event.detail.responseData.feed.feedUrl + ' ('+btoa(event.detail.responseData.feed.feedUrl)+')');
                    my.alert("ERROR saving feed in cache :\n" + event.detail.responseData.feed.feedUrl);
                });
            }

            // Add feed entries to array "unsortedEntries"

                gf.addFeed(event.detail.responseData.feed);

            // Check if all feeds were loaded

                var _nbFeedsToLoad = event.detail.responseData._myParams.nbFeeds;
                var _nbFeedsLoaded = gf.getNbFeedsLoaded();
                gf.setNbFeedsLoaded(++_nbFeedsLoaded);

                // Percentage of loading ?

                ui._loading(Math.round((100 * _nbFeedsLoaded) / _nbFeedsToLoad));

                // ---

                if (_nbFeedsLoaded == _nbFeedsToLoad) {
                    dspEntries(gf.getEntries(), params.entries.nbDaysAgo, params.feeds.selectedFeed);
                    dspFeeds(gf.getFeeds());
                    dspSettings();
                    updateFeedsPulsations();
                }

                if (_nbFeedsLoaded >= _nbFeedsToLoad) {
                    ui._loading(100); ui.echo("loading", "", "");
                    if (navigator.onLine) {
                        ui._onclick(sync, 'enable');
                    }
                }

            // ---

        }, true);

        document.body.addEventListener('GoogleFeed.load.error', function(event){

            // Check if all feeds were loaded

                my.error(event);

                var _nbFeedsToLoad = event.detail._myParams.nbFeeds; // different de "done"
                var _nbFeedsLoaded = gf.getNbFeedsLoaded();
                gf.setNbFeedsLoaded(++_nbFeedsLoaded);

                // Percentage of loading ?

                ui._loading(Math.round((100 * _nbFeedsLoaded) / _nbFeedsToLoad));

                // ---

                if (_nbFeedsLoaded == _nbFeedsToLoad) {
                    dspEntries(gf.getEntries(), params.entries.nbDaysAgo, params.feeds.selectedFeed);
                    dspFeeds(gf.getFeeds());
                    dspSettings();
                    updateFeedsPulsations();
                }

                if (_nbFeedsLoaded >= _nbFeedsToLoad) {
                    ui._loading(100); ui.echo("loading", "", "");
                    if (navigator.onLine) {
                        ui._onclick(sync, 'enable');
                    }
                }

            // ---

        }, true);

        document.body.addEventListener('GoogleFeed.find.done', findFeedsDisplayResults, true);

        /* ===================== */
        /* --- Feedly Events --- */
        /* ===================== */

        document.body.addEventListener('Feedly.login.done', function(response){
            _loginInProgress['feedly'] = true;
            my.log(feedly.getToken());
            params.accounts.feedly.logged = true;
            _saveParams();
            document.getElementById('feedlyLogin').checked = true; // Enable settings checkbox
            feedly.getSubscriptions(); // CustomEvent Feedly.getSubscriptions.done, Feedly.getSubscriptions.error
        });

        document.body.addEventListener('Feedly.login.error', function(response){
            my.log('CustomEvent : Feedly.login.error', arguments);
            my.message('Feedly login error');
        });

        document.body.addEventListener('Feedly.getSubscriptions.done', function(response){
            my.log('CustomEvent : Feedly.getSubscriptions.done');
            var _subscriptions = response.detail;
            var _feed = '';
            var _newFeeds = [];
            for (var i = 0; i < _subscriptions.length; i++) {
                _feed = {
                    'url': _subscriptions[i].id.substr(5, _subscriptions[i].id.length),
                    'pulsations': params['feeds']['defaultPulsations'],
                    'account': 'feedly',
                    'id': _subscriptions[i].id
                };
                _newFeeds.push(_feed);
            }
            addNewSubscriptions(_newFeeds);
            gf.setFeedsSubscriptions(myFeedsSubscriptions);
            
            if (_loginInProgress['feedly'] == true ) {
                _loginInProgress['feedly'] = false;
                gf.loadFeeds(params.entries.dontDisplayEntriesOlderThan);
            }
            
            my._save("subscriptions.feedly.json", "application/json", JSON.stringify(myFeedsSubscriptions.feedly)).then(function(results) {
                my.log("Save file subscriptions.feedly.json");
            }).catch(function(error) {
                my.error("ERROR saving file subscriptions.feedly.json", error);
                my.alert("ERROR saving file subscriptions.feedly.json");
            });
            my._save("cache/feedly/subscriptions.json", "application/json", JSON.stringify(_subscriptions)).then(function(results) {
                my.log("Save file cache/feedly/subscriptions.json");
            }).catch(function(error) {
                my.error("ERROR saving file cache/feedly/subscriptions.json", error);
                my.alert("ERROR saving file cache/feedly/subscriptions.json");
            });
        });

        document.body.addEventListener('Feedly.getSubscriptions.error', function(response) {
            my.log('CustomEvent : Feedly.getSubscriptions.error', arguments);
            my.alert(document.webL10n.get('feedly-get-subscriptions-error') + JSON.stringify(response.detail.message));
        });

        /* ============================= */
        /* --- The Old Reader Events --- */
        /* ============================= */

        document.body.addEventListener('TheOldReader.login.done', function(response){
            _loginInProgress['theoldreader'] = true;
            my.log('TheOldReader.getToken()', theoldreader.getToken());
            params.accounts.theoldreader.logged = true;
            _saveParams();
            document.getElementById('theoldreaderCheckbox').checked = true; // Enable settings checkbox
            document.getElementById('theoldreaderForm').style.cssText = 'display: none';
            theoldreader.getSubscriptions(); // CustomEvent TheOldReader.getSubscriptions.done, TheOldReader.getSubscriptions.error
        });

        document.body.addEventListener('TheOldReader.login.error', function(response){
            my.log('CustomEvent : TheOldReader.login.error', arguments);
            my.message('The Old Reader login error');
        });

        document.body.addEventListener('TheOldReader.getSubscriptions.done', function(response){
            my.log('CustomEvent : TheOldReader.getSubscriptions.done', response);
            var _subscriptions = response.detail.subscriptions;
            var _feed = '';
            var _newFeeds = [];
            for (var i = 0; i < _subscriptions.length; i++) {
                _feed = {
                    'url': _subscriptions[i].url,
                    'pulsations': params['feeds']['defaultPulsations'],
                    'account': 'theoldreader',
                    'id': _subscriptions[i].id
                };
                _newFeeds.push(_feed);
            }
            addNewSubscriptions(_newFeeds);
            gf.setFeedsSubscriptions(myFeedsSubscriptions);
            
            if (_loginInProgress['theoldreader'] == true ) {
                _loginInProgress['theoldreader'] = false;
                gf.loadFeeds(params.entries.dontDisplayEntriesOlderThan);
            }
            
            my._save("subscriptions.theoldreader.json", "application/json", JSON.stringify(myFeedsSubscriptions.theoldreader)).then(function(results) {
                my.log("Save file subscriptions.theoldreader.json");
            }).catch(function(error) {
                my.error("ERROR saving file subscriptions.theoldreader.json", error);
                my.alert("ERROR saving file subscriptions.theoldreader.json");
            });
            my._save("cache/theoldreader/subscriptions.json", "application/json", JSON.stringify(_subscriptions)).then(function(results) {
                my.log("Save file cache/theoldreader/subscriptions.json");
            }).catch(function(error) {
                my.error("ERROR saving file cache/theoldreader/subscriptions.json", error);
                my.alert("ERROR saving file cache/theoldreader/subscriptions.json");
            });
        });

        document.body.addEventListener('TheOldReader.getSubscriptions.error', function(response) {
            my.log('CustomEvent : TheOldReader.getSubscriptions.error', arguments);
            my.alert(document.webL10n.get('theoldreader-get-subscriptions-error') + JSON.stringify(response.detail.message));
        });
        
        /* ========================= */
        /* --- Aol Reader Events --- */
        /* ========================= */
        
        // Due to quick expiration time (1h), Aol token is 
        // actualized every 14mn.
        setInterval(function() {
            if ((navigator.onLine) && (params.accounts.aolreader.logged)) {
                aolreader.updateToken();
            }
        }, (60000 * 14));
  
        document.body.addEventListener('AolReader.login.done', function(response){
            _loginInProgress['aolreader'] = true;
            my.log(aolreader.getToken());
            params.accounts.aolreader.logged = true;
            _saveParams();
            document.getElementById('aolreaderLogin').checked = true; // Enable settings checkbox
            aolreader.getSubscriptions(); // CustomEvent AolReader.getSubscriptions.done, AolReader.getSubscriptions.error
        });

        document.body.addEventListener('AolReader.login.error', function(response){
            my.log('CustomEvent : AolReader.login.error', arguments);
            my.message('Aol Reader login error');
        });
        
        document.body.addEventListener('AolReader.getSubscriptions.done', function(response){
            my.log('CustomEvent : AolReader.getSubscriptions.done');
            var _subscriptions = response.detail.subscriptions;
            var _feed = '';
            var _newFeeds = [];
            for (var i = 0; i < _subscriptions.length; i++) {
                _feed = {
                    'url': _subscriptions[i].url,
                    'pulsations': params['feeds']['defaultPulsations'],
                    'account': 'aolreader',
                    'id': _subscriptions[i].id
                };
                _newFeeds.push(_feed);
            }
            addNewSubscriptions(_newFeeds);
            gf.setFeedsSubscriptions(myFeedsSubscriptions);
            
            if (_loginInProgress['aolreader'] == true ) {
                _loginInProgress['aolreader'] = false;
                gf.loadFeeds(params.entries.dontDisplayEntriesOlderThan);
            }

            my._save("subscriptions.aolreader.json", "application/json", JSON.stringify(myFeedsSubscriptions.aolreader)).then(function(results) {
                my.log("Save file subscriptions.aolreader.json");
            }).catch(function(error) {
                my.error("ERROR saving file subscriptions.aolreader.json", error);
                my.alert("ERROR saving file subscriptions.aolreader.json");
            });
            my._save("cache/aolreader/subscriptions.json", "application/json", JSON.stringify(_subscriptions)).then(function(results) {
                my.log("Save file cache/aolreader/subscriptions.json");
            }).catch(function(error) {
                my.error("ERROR saving file cache/aolreader/subscriptions.json", error);
                my.alert("ERROR saving file cache/aolreader/subscriptions.json");
            });
        });

        document.body.addEventListener('AolReader.getSubscriptions.error', function(response) {
            my.log('CustomEvent : AolReader.getSubscriptions.error', arguments);
            my.alert(document.webL10n.get('aolreader-get-subscriptions-error') + JSON.stringify(response.detail.message));
        });

        /* ============================ */
        /* --- Tiny Tiny Rss Events --- */
        /* ============================ */

        document.body.addEventListener('TinyTinyRss.login.done', function(response){
            _loginInProgress['tinytinyrss'] = true;
            my.log('TinyTinyRss.getToken()', tinytinyrss.getToken());
            params.accounts.tinytinyrss.logged = true;
            _saveParams();
            document.getElementById('tinytinyrssCheckbox').checked = true; // Enable settings checkbox
            document.getElementById('tinytinyrssForm').style.cssText = 'display: none';
            tinytinyrss.getSubscriptions(); // CustomEvent TinyTinyRss.getSubscriptions.done, TinyTinyRss.getSubscriptions.error
        });

        document.body.addEventListener('TinyTinyRss.login.error', function(response){
            my.log('CustomEvent : TinyTinyRss.login.error', arguments);
            my.message('Tiny Tiny Rss login error');
        });

        document.body.addEventListener('TinyTinyRss.getSubscriptions.done', function(response){
            my.log('CustomEvent : TinyTinyRss.getSubscriptions.done', response);
            var _subscriptions = response.detail.content;
            var _feed = '';
            var _newFeeds = [];
            for (var i = 0; i < _subscriptions.length; i++) {
                _feed = {
                    'url': _subscriptions[i].feed_url,
                    'pulsations': params['feeds']['defaultPulsations'],
                    'account': 'tinytinyrss',
                    'id': _subscriptions[i].id
                };
                _newFeeds.push(_feed);
            }
            addNewSubscriptions(_newFeeds);
            gf.setFeedsSubscriptions(myFeedsSubscriptions);
            
            if (_loginInProgress['tinytinyrss'] == true ) {
                _loginInProgress['tinytinyrss'] = false;
                gf.loadFeeds(params.entries.dontDisplayEntriesOlderThan);
            }
            
            my._save("subscriptions.tinytinyrss.json", "application/json", JSON.stringify(myFeedsSubscriptions.tinytinyrss)).then(function(results) {
                my.log("Save file subscriptions.tinytinyrss.json");
            }).catch(function(error) {
                my.error("ERROR saving file subscriptions.tinytinyrss.json", error);
                my.alert("ERROR saving file subscriptions.tinytinyrss.json");
            });
            my._save("cache/tinytinyrss/subscriptions.json", "application/json", JSON.stringify(_subscriptions)).then(function(results) {
                my.log("Save file cache/tinytinyrss/subscriptions.json");
            }).catch(function(error) {
                my.error("ERROR saving file cache/tinytinyrss/subscriptions.json", error);
                my.alert("ERROR saving file cache/tinytinyrss/subscriptions.json");
            });
        });

        document.body.addEventListener('TinyTinyRss.getSubscriptions.error', function(response) {
            my.log('CustomEvent : TinyTinyRss.getSubscriptions.error', arguments);
            my.alert(document.webL10n.get('tinytinyrss-get-subscriptions-error') + JSON.stringify(response.detail.message));
        });

        // ============
        // --- Main ---
        // ============

        ui.init();
        ui._quickScrollTo(0);
    };
