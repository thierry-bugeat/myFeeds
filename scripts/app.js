    // Firefox OS 
    // Style Guide          : https://www.mozilla.org/en-US/styleguide/products/firefox-os/
    // Icones               : http://buildingfirefoxos.com/downloads/
    // APIs List            : https://developer.mozilla.org/fr/Apps/Reference/Firefox_OS_device_APIs
    // Device Storage API   : https://developer.mozilla.org/en-US/docs/Web/API/Device_Storage_API
    // Browser API          : https://developer.mozilla.org/fr/docs/WebAPI/Browser
    // CSP                  : https://developer.mozilla.org/fr/Apps/PSC
    // <iframe> : https://developer.mozilla.org/fr/docs/Web/HTML/Element/iframe
    
    // A voir : 
    // http://imikado.developpez.com/tutoriels/firefoxOS/ma-premier-application/
    // http://toddmotto.com/is-it-time-to-drop-jquery-essentials-to-learning-javascript-from-a-jquery-background/
    
    var My = new MyFeeds();
    var ui = new MyUi();

    var tor = new TheOldReader();
    var feedly = new Feedly();

    var gf = new GoogleFeed();
    
    var _myTimestamp;       // Value set by function "_setMyTimestamp()"
    
    var myFeedsSubscriptions = {'local': [], 'feedly': [], 'theoldreader': []} ; // Store informations about feeds (urls)
    
    //addFeedsFromMyOnlineAccounts();
    
    var params = {
        "feeds": {
            "selectedFeed": ""                  // Display all feeds if empty otherwise display specified feed url
        },
        "entries": {
            "nbDaysAgo": 0,                     // Display only today's entries
            "maxLengthForSmallEntries": "400",  // Max number of characters to display an entry as small entry
            "dontDisplayEntriesOlderThan": "7", // In days
            "displaySmallEntries": false,       // Display small entries. true, false
            "updateEvery": 900,                 // Update entries every N seconds
            "theme": "grid"                     // card (default), grid
        },
        "accounts": {
            "feedly": false,
            "theoldreader": false
        }
    };
    
    var settings = {
        "developper_menu": true,               // Display or not developper menu in settings
        "update": {
            "every": [900, 1800, 3600]          // In seconds 5mn, 30mn, 60mn
        },
        "days": [3, 5, 7, 10]
    }
    
    var _entriesUpdateInterval = '';

    // Connection type : wifi, cellular, none

    /*var connectionType = "none";
    var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    try {
        connectionType = connection.type;
    } catch(err) {
        console.error(err.message);
    }*/
    
    // Load params from SDCard.
    // Save file if file doesn't exists.
    
    My._load('params.json').then(function(_myParams) {
        console.log('loading params from file params.json ...', _myParams);
        params = _myParams;
        // Get and set Feedly token from cache
        if (params.accounts.feedly) {
            My._load('cache/feedly/access_token.json').then(function(_token){
                feedly.setToken(_token);
            }).catch(function(error) {
                window.alert("Can't load and set Feedly token");
            });
        }
        // Get and set The Old Reader token from cache
        if (params.accounts.theoldreader) {
            My._load('cache/theoldreader/access_token.json').then(function(_token){
                tor.setToken(_token);
            }).catch(function(error) {
                window.alert("Can't load and set T.O.R. token");
            });
        }
    }).catch(function(error) {
        _saveParams();
    });
    
    // ---
    
    var sortedEntries = [];
    var sortedFeeds = [];
    
    // DOM elements :
    
    var main_entry_container    = document.getElementById("main-entry-container");
    var main_entry              = document.getElementById("main-entry");
    var browser                 = document.getElementById("browser");
    var loading                 = document.getElementById("loading");
    var feeds_entries           = document.getElementById("feeds-entries");
    
    var sync                    = document.getElementById("sync");
    var menu                    = document.getElementById("menu");
    var search                  = document.getElementById("search");
    var settingsOpen            = document.getElementById("settingsOpen");
    var find_feeds              = document.getElementById("find-feeds");
    var findFeedsOpen           = document.getElementById("findFeedsOpen");
    var findFeedsClose          = document.getElementById("findFeedsClose");
    var findFeedsSubmit         = document.getElementById("findFeedsSubmit");
    var share                   = document.getElementById("share");
    var feedsEntriesNbDaysAgo   = document.getElementById("feedsEntriesNbDaysAgo");
    var displayGrid             = document.getElementById("displayGrid");
    var displayCard             = document.getElementById("displayCard");
    var displayList             = document.getElementById("displayList");
        
    //var loadSubscriptions     = document.getElementById("loadSubscriptions");
    //var saveSubscriptions     = document.getElementById("saveSubscriptions");
    
    // DOM clicks :
    
    //search.onclick = function(event) {
      //  tor.login(); // test a supprimer
        //feedly.deleteSubscription('http://linuxfr.org/news.atom');
    //}
    sync.onclick            = function(event) { ui._onclick(this, 'disable'); ui.echo("feeds-list", "Loading...", ""); gf.loadFeeds(params.entries.dontDisplayEntriesOlderThan); }
    menu.onclick            = function(event) { openWindow("feeds-list-container", "left"); }
    closeMainEntry.onclick  = function(event) { closeWindow("main-entry-container", "right"); ui.echo("browser", "", ""); }
    closeFeedsList.onclick  = function(event) { closeWindow("feeds-list-container", "left"); }
    findFeedsOpen.onclick   = function(event) { openWindow("find-feeds-container", "left"); }
    findFeedsClose.onclick  = function(event) { closeWindow("find-feeds-container", "left"); }
    findFeedsSubmit.onclick = function(event) { var _keywords = document.getElementById("findFeedsText").value; if (_keywords) {ui.echo("find-feeds", "Loading...", ""); gf.findFeeds(_keywords);} }
    settingsOpen.onclick    = function(event) { openWindow("settings-container", "right"); }
    settingsClose.onclick   = function(event) { closeWindow("settings-container", "right"); }
    displayGrid.onclick     = function(event) {
        params.entries.theme = "grid"; 
        dspEntries(gf.getEntries(), params.entries.nbDaysAgo, params.feeds.selectedFeed);
        _saveParams();
    }
    displayCard.onclick     = function(event) {
        params.entries.theme = "card"; 
        dspEntries(gf.getEntries(), params.entries.nbDaysAgo, params.feeds.selectedFeed);
        _saveParams();
    }
    displayList.onclick     = function(event) {
        params.entries.theme = "list"; 
        dspEntries(gf.getEntries(), params.entries.nbDaysAgo, params.feeds.selectedFeed);
        _saveParams();
    }
    
    loadSubscriptions.onclick   = function(event) { 
        if (window.confirm(document.webL10n.get('confirm-load-subscriptions'))) {
            My._load('subscriptions.local.json').then(
                function (_mySubscriptions) {
                    try{
                        addNewSubscriptions(_mySubscriptions);
                    } catch (err) {
                        window.alert(err.message);
                    }
                    gf.setFeedsSubscriptions(myFeedsSubscriptions);
                    gf.loadFeeds(params.entries.dontDisplayEntriesOlderThan);
                }
            ).catch(function(error) {
                window.alert(document.webL10n.get('error-cant-load-local-subscriptions') + JSON.stringify(error));
            });
        }
    }
    
    saveSubscriptions.onclick   = function(event) { 
        if (window.confirm(document.webL10n.get('confirm-save-subscriptions'))) {
            var _output = [];
            var _feeds = gf.getFeeds();
            var _feed = "";
            for (var i = 0 ; i < _feeds.length; i++) {
                if ( _feeds[i]._myAccount == "local") {
                    _url = _feeds[i].feedUrl;
                    _feed = {"url": _url, "pulsations": _feeds[i]._myPulsations, "account": _feeds[i]._myAccount};
                    _output.push(_feed);
                }
            }
            My._save("subscriptions.local.json", "application/json", JSON.stringify(_output));
        }
    }
    
    nextDay.onclick = function(event) {
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
    
    function deleteFeed(_this) {
        console.log('deleteFeed() ', arguments);
        
        var _feedUrl = _this.getAttribute("feedUrl");
        var _account = _this.getAttribute("account");
        var _confirm = window.confirm(_account + ' : ' + document.webL10n.get('confirm-delete-feed'));
        
        if (_confirm) {

            var _tmp = [];
            
            entryFade(_this);
            
            // (1) Delete feedUrl from array "myFeedsSubscriptions[_account]"
            
            for (var i = 0; i < myFeedsSubscriptions[_account].length; i++) {
                if (myFeedsSubscriptions[_account][i].url != _feedUrl) {
                    //delete myFeedsSubscriptions.local[i];
                    _tmp.push(myFeedsSubscriptions[_account][i]);
                    //break;
                }
            }

            myFeedsSubscriptions[_account] = _tmp.slice();
            
            // (3) Delete from Feedly
            
            if (_account == 'feedly') {
                feedly.deleteSubscription(_feedUrl);
            }
            
            // (4) Reload UI

            if ((myFeedsSubscriptions.local.length > 0) || 
                (myFeedsSubscriptions.feedly.length > 0) ||
                (myFeedsSubscriptions.theoldreader.length > 0)
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
        console.log('findFeedsDisplayResults()', arguments);
        console.log(event);
        
        if (event.detail.responseStatus == 200) {
            var _results = event.detail.responseData.entries;
            var _htmlResults = "<ul>";
            
            for (var i = 0 ; i < _results.length; i++) {
                _htmlResults = _htmlResults + '<li><a href="#"><p><button class="addNewFeed" feedUrl="' + _results[i].url + '"><span data-icon="add"></span></button>' + _results[i].title + '</p><p><time>' + _results[i].url + '</time></p></a></li>';
            }
            
            _htmlResults = _htmlResults + "</ul>";
        
            ui.echo("find-feeds", _htmlResults, "");
            
            // ==================
            // --- Add Events ---
            // ==================
            
            // onclick delete button :
            
            var _adds = document.querySelectorAll(".addNewFeed");
            
            for (var i = 0; i < _adds.length; i++) {
                _adds[i].onclick = function() { findFeedsAddNewFeed(this);}
            }
        
        } else {
            ui.echo("find-feeds", "Find feeds : Network error", "prepend");
        }
    }
    
    function findFeedsAddNewFeed(_this) {
        console.log('findFeedsAddNewFeed() ', arguments);
        
        var _feedUrl = _this.getAttribute("feedUrl");
        var _confirm = window.confirm(document.webL10n.get('confirm-add-feed'));
        
        if (_confirm) {
            
            var _myNewFeed = {"url": _feedUrl, "pulsations": 20};
            
            // (1) Add feedUrl to array "myFeedsSubscriptions.local"

            myFeedsSubscriptions.local.push(_myNewFeed);
            
            // (2) Reload UI
            
            gf.setFeedsSubscriptions(myFeedsSubscriptions);
            gf.loadFeeds(params.entries.dontDisplayEntriesOlderThan);
        }
    }
    
    function dspSettings() {
        var _now = new Date();
        var _minutes = _now.getMinutes();
        
        if (_minutes < 10) {
            _minutes = "0" + _minutes;
        }
        
        // Small entries selector
        
        if (params.entries.displaySmallEntries) {
            _displaySmallEntriesChecked = 'checked=""';
        } else {
            _displaySmallEntriesChecked = "";
        }
        
        // Feedly selector
        
        if (params.accounts.feedly) {
            _feedlyAccount = 'checked=""';
        } else {
            _feedlyAccount = "";
        }
        
        // The Old Reader selector
        
        if (params.accounts.theoldreader) {
            _theoldreaderAccount = 'checked=""';
        } else {
            _theoldreaderAccount = "";
        }
        
        // Update every 
        
        var _every = settings.update.every;
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
        
        // Max nb Days 
        
        var _days = settings.days;
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
        
        // ---
        
        var _htmlSettings = [
        '<h2>' + document.webL10n.get('settings-feeds') + '</h2>                                                                                            ',
        '<ul>                                                                                                                                               ',
        '   <li><span data-icon="reload"></span>' + document.webL10n.get('settings-last-update') + _now.getHours() + ':' + _minutes + '</li>                ',
        '   <li><span data-icon="sync"></span>' + document.webL10n.get('settings-update-every') + _htmlSelectUpdateEvery + '</li>                           ',
        '</ul>                                                                                                                                              ',
        '<h2>' + document.webL10n.get('settings-news') + '</h2>                                                                                             ',
        '<ul>                                                                                                                                               ',
        '   <li><span data-icon="messages"></span>' + document.webL10n.get('settings-small-news') + '<div><label class="pack-switch"><input id="toggleDisplaySmallEntries" type="checkbox" ' + _displaySmallEntriesChecked + '><span></span></label></div></li>',
        '   <li><span data-icon="messages"></span>' + document.webL10n.get('settings-number-of-days') + _htmlMaxNbDays + '</li>                             ',
        '</ul>                                                                                                                                              ',
        '<h2>' + document.webL10n.get('settings-online-accounts') + '</h2>                                                                                  ',
        '<ul>                                                                                                                                               ',
        '   <li><span data-icon="messages"></span>Feedly<div><label class="pack-switch"><input id="feedlyLogin" type="checkbox" ' + _feedlyAccount + '><span></span></label></div></li>',
        '   <li>',
        '       <span data-icon="messages"></span>The Old Reader<div><label class="pack-switch"><input id="theoldreaderLogin" type="checkbox" ' + _theoldreaderAccount + '><span></span></label></div>',
        '       <p><input id="theoldreaderEmail" required="" placeholder="Email" name="theoldreaderEmail" type="text" value=""></p>                         ',
        '       <p><input id="theoldreaderPasswd" required="" placeholder="Password" name="theoldreaderPasswd" type="text" value=""><p>                     ',
        '   </li>                                                                                                                                           ',
        '</ul>                                                                                                                                              ',
        '<h2 class="developper-menu">' + document.webL10n.get('settings-developper-menu') + '</h2>                                                          ',
        '<ul class="developper-menu">                                                                                                                       ',
        '   <li><span data-icon="messages"></span>Connection<div id="connectionType">@todo</div></li>                                                       ',
        '</ul>                                                                                                                                              '
        ].join(''); 

        ui.echo("settings", _htmlSettings, "");

        // ============================
        // --- Show developper menu ---
        // ============================
        
        if (settings.developper_menu == true) {
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
            params.entries.displaySmallEntries = !params.entries.displaySmallEntries;
            _saveParams();
        }
        
        var _selectUpdateEvery = document.getElementById('selectUpdateEvery');
        _selectUpdateEvery.onchange = function(e) {
            params.entries.updateEvery = _selectUpdateEvery.options[_selectUpdateEvery.selectedIndex].value;
            _saveParams();
            
            // Automatic update entries every N seconds :
            // Clear and reset interval
            
            clearInterval(_entriesUpdateInterval);
            
            _entriesUpdateInterval = setInterval(function() {
                ui._onclick(sync, 'disable');
                gf.loadFeeds(params.entries.dontDisplayEntriesOlderThan);
            }, (params.entries.updateEvery * 1000));
            
        }
        
        var _selectMaxNbDays = document.getElementById('selectMaxNbDays');
        _selectMaxNbDays.onchange = function(e) {
            params.entries.dontDisplayEntriesOlderThan = _selectMaxNbDays.options[_selectMaxNbDays.selectedIndex].value;
            _saveParams();
        }
        
        // Feedly checkbox
        
        document.getElementById('feedlyLogin').onclick = function() {
            if (this.checked) {
                this.checked = false; // False until CustomEvent Feedly.login.done
                feedly.login();
            } else {
                params.accounts.feedly = false;
                _saveParams();
            }
        }
        
        // Feedly checkbox
        
        document.getElementById('theoldreaderLogin').onclick = function() {
            if (this.checked) {
                this.checked = false; // False until CustomEvent TheOldReader.login.done
                var _email = document.getElementById("theoldreaderEmail").value;
                var _passwd = document.getElementById("theoldreaderPasswd").value;
                tor.login(_email, _passwd);
            } else {
                params.accounts.feedly = false;
                _saveParams();
            }
        }
        
        // Update connection type : wifi, cellular, none

        /*function updateConnectionStatus() {
            console.log("Connection type is change from " + connectionType + " to " + connection.type);
            connectionType = connection.type;
            echo("connectionType", connectionType, "");
        }

        connection.addEventListener('typechange', updateConnectionStatus);*/
        
        // ---
        
    }
    
    function dspFeeds(feeds) {
        
        console.log('dspFeeds()');

        console.log(feeds);
        console.log(feeds.length + ' feeds');
        
        var _html = { 
            'local': '<h2>Local</h2><ul>', 
            'feedly': '<h2>Feedly</h2><ul>',
            'theoldreader': '<h2>The Old Reader</h2><ul>'
        };
        var _htmlFeeds = "";
        var _feedlyAccessToken = feedly.getToken().access_token;
        var _theoldreaderAuth = tor.getToken().Auth;
        
        // ==========================
        // --- Display feeds list ---
        // ==========================
        
        for (var i = 0; i < feeds.length; i++) {
            var _feed = feeds[i];
            var _account = _feed._myAccount;
            var _deleteIcone = '';
            
            if ((_account == 'local') || 
                ((_account == 'feedly') && (_feedlyAccessToken !== undefined)) || 
                ((_account == 'theoldreader') && (_theoldreaderAuth !== undefined))
            ){
                _deleteIcone = '<button class="delete" account="' + _account + '" feedUrl="' + _feed.feedUrl + '"><span data-icon="delete"></span></button>';
            }
            
            _html[_account] = _html[_account] + '<li><a href="#" class="open" feedUrl="' + _feed.feedUrl + '"><p>' + _deleteIcone + '<button><span data-icon="' + _feed._myPulsationsIcone + '"></span></button>' + _feed.title + '</p><p><time>' + new Date(_feed._myLastPublishedDate) + '</time></p></a></li>';
        }

        _htmlFeeds = _htmlFeeds + 
            '<ul>' +
            '<li><a href="#" class="open" feedUrl=""><p><button><span data-icon="forward"></span></button>' + document.webL10n.get('all-feeds') + '</p></a></li>' +
            '</ul>' + 
            _html['local'] + '</ul>' + 
            _html['feedly'] + '</ul>' + 
            _html['theoldreader'] + '</ul>' + 
            '';
        
        // --- Display ---
        
        ui.echo("feeds-list", _htmlFeeds, "");
        
        // ==================
        // --- Add Events ---
        // ==================
        
        // onclick delete button :
        
        var _deletes = document.querySelectorAll(".delete");
        
        for (var i = 0; i < _deletes.length; i++) {
            _deletes[i].onclick = function(e) { 
                e.stopPropagation();
                e.preventDefault();
                deleteFeed(this);
            }
        }
        
        // onclick open feed : 
        
        var _opens = document.querySelectorAll(".open");
        
        for (var i = 0; i < _opens.length; i++) {
            _opens[i].onclick = function() { 
                closeWindow("feeds-list-container", "left");
                params.entries.nbDaysAgo = 0;
                params.feeds.selectedFeed = this.getAttribute("feedUrl");
                _saveParams();
                dspEntries(gf.getEntries(), params.entries.nbDaysAgo, params.feeds.selectedFeed);
            }
        }
    }
    
    function dspEntries(entries, nbDaysAgo, feedUrl) {

        console.log("dspEntries()", arguments);
        console.log(entries);
        
        sortedEntries = entries;
        
        _setMyTimestamp();
        
        var _timestampMin = _myTimestamp - (86400 * nbDaysAgo);
        var _timestampMax = _myTimestamp - (86400 * nbDaysAgo) + 86400;
        
        var _previousDaysAgo    = -1; // Count days to groups entries by day.
        var _entrieNbDaysAgo    = 0;
        
        var _nbEntriesDisplayed = 0;
        
        // =======================
        // --- Display entries ---
        // =======================
                    
        var _htmlEntries = "";
        var _htmlFeedTitle = "";
        var _firstEntrie = true;
        var _theme = params.entries.theme;

        for (var i = 0; i < sortedEntries.length; i++) {

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
                
                if ((_myTimestamp - _entrie._myTimestamp) < (params.entries.dontDisplayEntriesOlderThan * 86400)) {
                    
                    //console.log(_entrie._myTimestamp + ' ('+(new Date(_entrie.publishedDate).toUTCString()) +') | '+_myTimestamp+' (' + (new Date(_myTimestamp*1000)).toUTCString() + ') ==> Diff = ' + (_myTimestamp - _entrie._myTimestamp) + ' / ' + _entrieNbDaysAgo + ' day(s) ago / ' + _entrie.title);
                    
                    // ---

                    // Date analyse
                    // https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Date/toLocaleString
                    // https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/DateTimeFormat
                    
                    var _date = new Date(_entrie.publishedDate);
                    
                    // Diff between "contentSnippet" et "content" ?
                    // Small article or not ?
                    
                    var _diff = _entrie.content.length - _entrie.contentSnippet.length;
                    
                    // 1st image 
                    
                    var _imageUrl = "";
                    
                    if (_entrie._myFirstImageUrl) {
                        if (_diff < params.entries.maxLengthForSmallEntries) {
                            _imageUrl = '<span class="my-'+_theme+'-image-container '+_theme+'-ratio-image-s"><img src="' + _entrie._myFirstImageUrl + '"/></span>'; 
                        } else {
                            _imageUrl = '<span class="my-'+_theme+'-image-container '+_theme+'-ratio-image-l"><img src="' + _entrie._myFirstImageUrl + '"/></span>'; 
                        }
                    }
                    
                    // Entry class ratio ?
                    
                    var _ratioClass = _theme + '-ratio-entry-l';
                    
                    if ((_diff <= params.entries.maxLengthForSmallEntries) && (!_entrie._myFirstImageUrl)) {
                        _ratioClass = _theme + '-ratio-entry-s';
                    }
                    
                    else if ((_diff <= params.entries.maxLengthForSmallEntries) || (!_entrie._myFirstImageUrl)) {
                        _ratioClass = _theme + '-ratio-entry-m';
                    }
                    
                    // Account icone ?
                    
                    var _accountIcone = '';
                    
                    if (_entrie._myFeedInformations._myAccount != 'local') {
                        _accountIcone = '<img src="images/' + _entrie._myFeedInformations._myAccount + '.png" />';
                    }

                    // Content ( Normal / Small )
                    
                    var _content = "";
                    
                    if (_diff >= params.entries.maxLengthForSmallEntries) {
                        _content = _content + '<div class="my-'+_theme+'-entry-l ' + _ratioClass + '" i="' + i + '">';
                        _content = _content + '<span class="my-'+_theme+'-title">' + _accountIcone + _entrie.title + '</span>';
                        _content = _content + '<span class="my-'+_theme+'-feed-title">' + _entrie._myFeedInformations.title + '</span>';
                        _content = _content + _imageUrl;
                        _content = _content + '<span class="my-'+_theme+'-date">' + _date + '</span>';
                        _content = _content + '<span class="my-'+_theme+'-snippet">' + _entrie.contentSnippet + '</span>';
                        _content = _content + '</div>';
                        
                        _nbEntriesDisplayed++;
                        
                    } else if (params.entries.displaySmallEntries) {
                        _content = _content + '<div class="my-'+_theme+'-entry-s ' + _ratioClass + '" entry_link="' + _entrie.link + '">';
                        _content = _content + '<span class="my-'+_theme+'-title">' + _accountIcone + _entrie.title + '</span>';
                        _content = _content + '<span class="my-'+_theme+'-feed-title">' + _entrie._myFeedInformations.title + '</span>';
                        _content = _content + _imageUrl;
                        _content = _content + '<span class="my-'+_theme+'-date">' + _date + '</span>';
                        _content = _content + '</div>';
                        
                        _nbEntriesDisplayed++;
                    }
                    
                    // Add to html entries
                    
                    _htmlEntries = _htmlEntries + _content;
                
                } else { break; }
            }
            
        }
        
        // --- Display Today / Yesterday / Nb days ago ---

        if (nbDaysAgo == 0) {
            _daySeparator = document.webL10n.get('nb-days-ago-today');
        } else if (nbDaysAgo == 1) {
            _daySeparator = document.webL10n.get('nb-days-ago-yesterday');
        } else {
            _daySeparator = myExtraTranslations['nb-days-ago'].replace('{{n}}', nbDaysAgo);
        }
        
        ui.echo('feedsEntriesNbDaysAgo', _daySeparator, '');
        
        // Display entries
        
        if (_nbEntriesDisplayed > 0) {
            ui.echo("feeds-entries", _htmlFeedTitle + _htmlEntries, "");
        } else {
            ui.echo("feeds-entries", _htmlFeedTitle + '<div class="notification">' + document.webL10n.get('no-news-today') + '</div>', "");
        }
        
        // ==================
        // --- Add Events ---
        // ==================
        
        // onclick Small Entries:
        
        var _small_entries = document.querySelectorAll(".my-"+_theme+"-entry-s");
        
        for (var i = 0; i < _small_entries.length; i++) {
            _small_entries[i].onclick = function() { entryFade(this); mainEntryOpenInBrowser(null, this.getAttribute("entry_link")); }
        }
        
        // onclick Normal Entries :
        
        var _entries = document.querySelectorAll(".my-"+_theme+"-entry-l");
        
        for (var i = 0; i < _entries.length; i++) {
            _entries[i].onclick = function() { entryFade(this); mainEntryOpenInBrowser(this.getAttribute("i"), ""); }
        }

    }
    
    function entryFade(_this) {
        _this.style.cssText = "opacity : 0.4;";
    }
    
    function _file_informations(filename) {
        var sdcard = navigator.getDeviceStorage('sdcard');

        var request = sdcard.get("myFeeds/" + filename);

        request.onsuccess = function () {
            var file = this.result;
            console.log("Get the file: ", file);
        }

        request.onerror = function () {
            console.warn("Unable to get the file: " + this.error);
        }
    }
    
    function mainEntryOpenInBrowser(entryId, url) {
        console.log('mainEntryOpenInBrowser()', arguments);
        document.body.style.cssText = "overflow: hidden;";  // Disable scroll in entries list.

        if (entryId !== null) {
            var _entry = sortedEntries[entryId];
            var _srcDoc = "";
            var _regex = new RegExp("'", "g");
            var _author = "";
            
            share.setAttribute("i", entryId);
            
            if (_entry.author !== "") {
                _author = '<div class="entrie-author">' + myExtraTranslations['by'] + ' ' + _entry.author + '</div>';
            }

            _srcDoc = _srcDoc + _srcDocCss; // Inline CSS from file "style/inline.css.js"
            _srcDoc = _srcDoc + '<div class="entrie-title">' + _entry.title.replace(_regex, "&#39;") + '</div>';
            _srcDoc = _srcDoc + '<div class="entrie-date">' + new Date(_entry.publishedDate) + '</div>';
            _srcDoc = _srcDoc + _author;
            _srcDoc = _srcDoc + '<div class="entrie-feed-title"><a href="' + _entry._myFeedInformations.link + '">' + _entry._myFeedInformations.title + '</a></div>';
            _srcDoc = _srcDoc + '<div class="entrie-contentSnippet">' + _entry.content.replace(_regex, "&#39;") + '</div>';
            _srcDoc = _srcDoc + '<div class="entrie-visit-website"><a href="' + _entry.link + '">' + document.webL10n.get('entry-visit-website') + '</a></div>';
            
            ui.echo("browser", '<iframe srcdoc=\'' + _srcDoc + '\' sandbox="allow-same-origin allow-scripts" mozbrowser remote></iframe>', "");
        } else {
            ui.echo("browser", '<iframe src="' + url + '" sandbox="allow-same-origin allow-scripts" mozbrowser remote></iframe>', "");
        }
        
        document.getElementById("browser").style.cssText = "display: block;";
        
        main_entry.scrollTop = 0;
        
        openWindow("main-entry-container", "right");
    }
    
    /**
     * @param {null}
     * Update feeds pulsations once all feeds are loaded.
     * Update array "myFeedsSubscriptions.local" & indexedDb database.
     * */
    function updateFeedsPulsations() {
        var _tmp = [];
        var _feeds = gf.getFeeds();
        var _pulsations;
        var _feed = '';

        for (var i = 0 ; i < myFeedsSubscriptions.local.length; i++) {
            
            for (var j = 0 ; j < _feeds.length; j++) {
                
                if (myFeedsSubscriptions.local[i].url == _feeds[j].feedUrl) {

                    _url        = _feeds[j].feedUrl;
                    _pulsations = _feeds[j]._myPulsations;
                    _account    = _feeds[j]._myAccount; // test
                    
                    if (isNaN(_pulsations)) {
                        // do nothing
                    } else {
                        myFeedsSubscriptions.local[i].pulsations = _pulsations;
                    }
                    
                    break;
                }
            }
        }
    }
        
    /**
     * Open window from left or right
     * @param string divId Div identifiant
     * @param string placement "left", "right" Initial window placement.
     * */
    function openWindow(divId, placement) {
        document.body.style.cssText = "overflow: hidden;"; // Disable scroll in entries list.
        
        var _window = document.getElementById(divId);
        
        if (placement == "left") {
            _window.style.cssText = "transform: translateX(100%); -webkit-transition-duration: 0.5s; transition-duration: 0.5s;";
        } else {
            _window.style.cssText = "transform: translateX(-100%); -webkit-transition-duration: 0.5s; transition-duration: 0.5s;";
        }
    }
    
    /**
     * Close window from left or right
     * @param string divId Div identifiant
     * @param string placement "left", "right" Initial window placement.
     * */
    function closeWindow(divId, placement) {
        document.body.style.cssText = "overflow: auto;"; // Re-enable scroll in entries list.
        
        var _window = document.getElementById(divId);
        
        if (placement == "left") {
            _window.style.cssText = "transform: translateX(0%); -webkit-transition-duration: 0.5s; transition-duration: 0.5s;";
        } else {
            _window.style.cssText = "transform: translateX(100%); -webkit-transition-duration: 0.5s; transition-duration: 0.5s;";
        }
    }
    
    /**
     * Set start of day timestamp.
     * @param {null}
     * */
    function _setMyTimestamp() {
        var _now    = new Date();
        var _year   = _now.getFullYear();
        var _month  = _now.getMonth();
        var _day    = _now.getDate();
        
        var _mySod = new Date(_year, _month, _day, '00','00','00');
        
        _myTimestamp = Math.floor(_mySod.getTime() / 1000);
    }
    
    // Callback from event "idb.open.onsuccess"
    // 1st feeds loading.
    
    function initAndLoadFeeds(results) {
        console.log('initAndLoadFeeds()', arguments);

        // Add feeds from subscription file
        
        for (var i = 0; i < results.length; i++) {
            var _account = results[i].account;
            if (myFeedsSubscriptions[_account] === undefined) {
                myFeedsSubscriptions[_account] = [];
            }
            myFeedsSubscriptions[_account].push(results[i]);
        }        
        
        // No feeds sets.
        // Use default feeds ?
        
        var _nbFeedsSubscriptions = 0;
        
        for (var _account in myFeedsSubscriptions) {
            _nbFeedsSubscriptions = _nbFeedsSubscriptions + myFeedsSubscriptions[_account].length;
        }
        
        if (myFeedsSubscriptions.local.length == 0) {
            var _confirm = window.confirm(document.webL10n.get('confirm-populate-database'));
            if (_confirm) {
                var _populateMySubscriptions = [
                    {"url": "https://www.reddit.com/r/FireFoxOS/.rss",          "pulsations": 2,    "account": "local"},
                    {"url": "http://www.webupd8.org/feeds/posts/default",       "pulsations": 2,    "account": "local"},
                    {"url": "http://metro.co.uk/sport/football/feed/",          "pulsations": 5,    "account": "local"},
                    {"url": "http://sourceforge.net/blog/feed/",                "pulsations": 2,    "account": "local"},
                    {"url": "http://www.gorillavsbear.net/category/mp3/feed/",  "pulsations": 2,    "account": "local"},
                    {"url": "http://www.wired.com/feed/",                       "pulsations": 5,    "account": "local"}
                ];
                
                for (var i = 0; i < _populateMySubscriptions.length; i++) {
                    myFeedsSubscriptions.local.push(_populateMySubscriptions[i]);
                }
            }
        }
        
        // 1st feeds loading
        
        console.log('========================');
        console.log(myFeedsSubscriptions);
        console.log('========================');
        
        if (myFeedsSubscriptions.local.length > 0) {
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
        My._save("params.json", "application/json", JSON.stringify(params));
        params.entries.nbDaysAgo = _nbDaysAgo;
    }
    
    /**
     * Add new feeds in array myFeedsSubscriptions
     * if feeds doesn't exists in array.
     * @param {_feeds} array
     * */
    function addNewSubscriptions(_feeds) {
        console.log('addNewSubscriptions()', arguments);
        for (var i = 0; i < _feeds.length; i++) {
            _addNewSubscription(_feeds[i]);
        }
    }
    
    function _addNewSubscription(_feed) {
        console.log('_addNewSubscription()', arguments);
        
        var _insertNewFeed = true;
        var _account = _feed.account;
        
        if (myFeedsSubscriptions[_account] === undefined) {
            myFeedsSubscriptions[_account] = [];
        }
        
        var i = myFeedsSubscriptions[_account].length;
        while (i--) {
            if (myFeedsSubscriptions[_account][i].url === _feed.url) {
                _insertNewFeed = false;
                break;
            }
        }
        
        if (_insertNewFeed) {
            myFeedsSubscriptions[_account].push(_feed);
        }
    }
    
    // ======================
    // --- Ready to start ---
    // ======================
    
    window.onload = function () {
        
        _swipe("");

        // @todo 
        // load subscriptions.feedly.json
        // load subscriptions.theolsreader.json

        /*My._file_exists('subscriptions.local.json', function(exists){
            if (exists) {
                My._load('subscriptions.local.json').then(function(results) {
                    initAndLoadFeeds(results);
                }).catch(function(error) {
                    window.alert(document.webL10n.get('error-cant-load-local-subscriptions') + JSON.stringify(error));
                });
            }
        });*/
        
        My._file_exists_v2('subscriptions.local.json').then(function(results){
            return My._load('subscriptions.local.json');
        }).then(function(results){
            initAndLoadFeeds(results);
        }).catch(function(error) {
            window.alert(document.webL10n.get('error-cant-load-local-subscriptions') + JSON.stringify(error));
        });
        
        My._file_exists_v2('subscriptions.feedly.json').then(function(results){
            return My._load('subscriptions.feedly.json');
        }).then(function(results){
            initAndLoadFeeds(results);
        }).catch(function(error) {
            window.alert(document.webL10n.get('error-cant-load-local-subscriptions') + JSON.stringify(error));
        });
        
        My._file_exists_v2('subscriptions.theoldreader.json').then(function(results){
            return My._load('subscriptions.theoldreader.json');
        }).then(function(results){
            initAndLoadFeeds(results);
        }).catch(function(error) {
            window.alert(document.webL10n.get('error-cant-load-local-subscriptions') + JSON.stringify(error));
        });
        
        // =================================
        // --- Button load subscriptions ---
        // =================================
        // Disable button if subscriptions file doesn't exists.
        
        My._file_exists('subscriptions.local.json', function(exists){
            if (!exists) {
                ui._onclick(loadSubscriptions, 'disable');
            }
        });
        
        // ======================================
        // --- Button [sync] enable / disable ---
        // ======================================
        
        /*setInterval(function() {
            var _syncStatus = sync.style.pointerEvents;
            if (((myFeedsSubscriptions.local.lenght > 0) || (myFeedsSubscriptions.feedly.length > 0)) && (_syncStatus != _previousSyncStatus)) {
                ui._onclick(sync, 'enable');
                _previousSyncStatus = _syncStatus;
            }
        }, 500);*/
        
        // ==============
        // --- Events ---
        // ==============
        
        browser.addEventListener('mozbrowsererror', function (event) {
            console.dir("Moz Browser loading error : " + event.detail);
        });
        
        // Automatic update entries every N seconds :
        
        _entriesUpdateInterval = setInterval(function() {
            ui._onclick(sync, 'disable');
            gf.loadFeeds(params.entries.dontDisplayEntriesOlderThan);
        }, (params.entries.updateEvery * 1000));
        
        // Share entry :
        
        share.onclick = function() {
            console.log(this);
            var _entryId = this.getAttribute("i");
            var _entry = sortedEntries[_entryId];
            console.log(_entry);
            new MozActivity({
                name: "share",
                data: {
                    number: 1,
                    url: "mailto:?subject=" + encodeURIComponent(_entry.title) + "&body=" + encodeURIComponent(_entry.link)
                }
            });
        };
        
        // ---
    
        document.body.addEventListener('GoogleFeed.load.done', function(event){
            
            // Save feed as file
            
                My._save('cache/feeds/' + btoa(event.detail.responseData.feed.feedUrl) + ".json", "application/json", JSON.stringify(event.detail.responseData.feed));

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
                    ui._onclick(sync, 'enable');
                }
            
            // ---
            
        }, true);
        
        document.body.addEventListener('GoogleFeed.load.error', function(event){
            
            // Check if all feeds were loaded
            
                console.error(event);
                
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
                    ui._onclick(sync, 'enable');
                }
            
            // ---
            
        }, true);
        
        document.body.addEventListener('GoogleFeed.find.done', findFeedsDisplayResults, true);
        
        /* --- Feedly Events --- */
        
        document.body.addEventListener('Feedly.login.done', function(response){
            console.log(feedly.getToken());
            params.accounts.feedly = true;
            _saveParams();
            document.getElementById('feedlyLogin').checked = true; // Enable settings checkbox
            feedly.getSubscriptions(); // CustomEvent Feedly.getSubscriptions.done, Feedly.getSubscriptions.error
        });
        
        document.body.addEventListener('Feedly.login.error', function(response){
            console.log('CustomEvent : Feedly.login.error', arguments);
            window.alert('Feedly login error');
        });
        
        document.body.addEventListener('Feedly.getSubscriptions.done', function(response){
            console.log('CustomEvent : Feedly.getSubscriptions.done');
            var _subscriptions = response.detail;
            var _feed = '';
            var _newFeeds = [];
            for (var i = 0; i < _subscriptions.length; i++) {
                _feed = {
                    'url': _subscriptions[i].id.substr(5, _subscriptions[i].id.length),
                    'pulsations': 20,
                    'account': 'feedly'
                };
                _newFeeds.push(_feed);
            }
            addNewSubscriptions(_newFeeds);
            gf.setFeedsSubscriptions(myFeedsSubscriptions);
            gf.loadFeeds(params.entries.dontDisplayEntriesOlderThan);
            My._save("subscriptions.feedly.json", "application/json", JSON.stringify(myFeedsSubscriptions.feedly));
        });
        
        document.body.addEventListener('Feedly.getSubscriptions.error', function(response) {
            console.log('CustomEvent : Feedly.getSubscriptions.error', arguments);
            window.alert('Feedly error');
        });
        
        /* --- The Old Reader Events --- */
        
        document.body.addEventListener('TheOldReader.login.done', function(response){
            console.log('TheOldReader.getToken()', tor.getToken());
            params.accounts.theoldreader = true;
            _saveParams();
            document.getElementById('theoldreaderLogin').checked = true; // Enable settings checkbox
            tor.getSubscriptions(); // CustomEvent TheOldReader.getSubscriptions.done, TheOldReader.getSubscriptions.error
        });
        
        document.body.addEventListener('TheOldReader.login.error', function(response){
            console.log('CustomEvent : TheOldReader.login.error', arguments);
            window.alert('The Old Reader login error');
        });
        
        document.body.addEventListener('TheOldReader.getSubscriptions.done', function(response){
            console.log('CustomEvent : TheOldReader.getSubscriptions.done', response);
            var _subscriptions = response.detail.subscriptions;
            var _feed = '';
            var _newFeeds = [];
            for (var i = 0; i < _subscriptions.length; i++) {
                _feed = {
                    'url': _subscriptions[i].url,
                    'pulsations': 20,
                    'account': 'theoldreader'
                };
                _newFeeds.push(_feed);
            }
            addNewSubscriptions(_newFeeds);
            gf.setFeedsSubscriptions(myFeedsSubscriptions);
            gf.loadFeeds(params.entries.dontDisplayEntriesOlderThan);
            My._save("subscriptions.theoldreader.json", "application/json", JSON.stringify(myFeedsSubscriptions.theoldreader));
        });
        
        document.body.addEventListener('TheOldReader.getSubscriptions.error', function(response) {
            console.log('CustomEvent : TheOldReader.getSubscriptions.error', arguments);
            window.alert('The Old Reader error');
        });
    
        // ============
        // --- Main ---
        // ============
        
        ui.init();
    };
