/* ============ */
/* --- MyUi --- */
/* ============ */

var MyUi = function() {
    _MyUi = this;
    
    // DOM elements :

    var main_entry_container    = document.getElementById("main-entry-container");
    var main_entry              = document.getElementById("main-entry");
    var browser                 = document.getElementById("browser");
    var loading                 = document.getElementById("loading");
    var feeds_entries           = document.getElementById("feeds-entries");

    var sync                    = document.getElementById("sync");
    var menu                    = document.getElementById("menu");
    var topup                   = document.getElementById("topup");
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

}

MyUi.prototype.init = function() {

    _MyUi._onclick(topup, 'disable');     // Disable "topup" button when application start
    _MyUi._onclick(sync, 'disable');      // Disable "sync" button when application start
    _MyUi._onclick(nextDay, 'disable');
    
    _MyUi._onclick(search, 'disable');    // Not yet implemented
        
    // =======================================
    // --- Button [topup] enable / disable ---
    // =======================================
    
    var _topup = {
        "previousScrollTop": 0, 
        "previousStatus": "disabled"
    };
    
    setInterval(function() {
        
        // Scroll in progress
        
        if (feeds_entries.scrollTop != _topup['previousScrollTop']) {
            
            if (_topup['previousScrollTop'] == 0) { 
                _MyUi._onclick(topup, 'enable'); 
                _topup['previousStatus'] = 'enabled'; 
            }
            
            _topup['previousScrollTop'] = feeds_entries.scrollTop;
        } 
        
        // End scroll
        
        else {
            
            if ((_topup['previousStatus'] == 'enabled') && (feeds_entries.scrollTop == 0)) {
                _MyUi._onclick(topup, 'disable'); 
                _topup['previousStatus'] = 'disabled';
            }
        }
        
    }, 500);
    
    topup.onclick           = function(event) { _MyUi._onclick(topup, 'disable'); feeds_entries.scrollTop = 0; }
    
    // ==============
    // --- Events ---
    // ==============
        
    this.bind();
};

MyUi.prototype.bind = function() {
    
};

/**
 *
 * https://developer.mozilla.org/en-US/docs/Web/CSS/pointer-events
 * */
MyUi.prototype._onclick = function(_this, pointerEvents) {
    console.log(_this);
    
    if (_this !== null) {
        if (pointerEvents == 'enable') {
            _this.style.cssText = "opacity: 1";
            _this.style.pointerEvents = 'auto';
        } else {
            _this.style.cssText = "opacity: 0.3";
            _this.style.pointerEvents = 'none';
        }
    }
}

/**
 * Enable disable ui elements. 
 * Used when network connection change.
 * param {string} _status "enable", "disable"
 * */
MyUi.prototype.toggle = function(_status) {
    
    // Settings screen : Update settings message
                
    _MyUi.echo("onLine", _status, "");
    
    // Main screen : Disable, enable "sync" button
    
    _MyUi._onclick(sync, _status);
        
    // Feeds list : Disable, enable "delete" buttons
    
    var _deletes = document.querySelectorAll("ul.feedly button.delete, ul.theoldreader button.delete");
    for (var i = 0; i < _deletes.length; i++) {
        _MyUi._onclick(_deletes[i], _status);
    }
    
    // Settings screen : Disable, enable online accounts
    
    var _settings = document.querySelectorAll("#settings > ul.feedly > li, #settings > ul.theoldreader > li");
    for (var i = 0; i < _settings.length; i++) {
        _MyUi._onclick(_settings[i], _status);
    }
    
    // Main screen : Disable, enable short news
    // Short news requires network connection to display content.
    
    var _small = document.querySelectorAll(".small");
    for (var i = 0; i < _small.length; i++) {
        _MyUi._onclick(_small[i], _status);
    }
}

/**
 * Output one html string in div element
 * 
 * param string divId    : Div id element
 * param string msg      : Html string to write
 * param string placement: "append", "prepend", ""
 * */
MyUi.prototype.echo = function(divId, msg, placement) {
    var _out = document.getElementById(divId);
    
    if (placement == 'prepend') {
        _out.innerHTML = msg + _out.innerHTML;
    } else if (Boolean(placement)) {
        _out.innerHTML = _out.innerHTML + msg;
    } else {
        _out.innerHTML = msg;
    }

}

/**
 * Display loading bar.
 * param {int} percentage
 * */
MyUi.prototype._loading = function(percentage) {
    if (percentage >= 100) {
        loading.style.cssText = "width: 0%";
    } else {
        loading.style.cssText = "width: " + percentage + "%";
    }
}
