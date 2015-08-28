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
 * Enable or disable UI element.
 * Change opacity and enable or disable click event.
 * @param {string} DOM ID element
 * @param {string} "enable", "disable"
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
 * Disable UI elements.
 * Used when app is offline as startup.
 * @param {sting} _status "disable"
 * */
MyUi.prototype._disable = function(_status) {
    _MyUi.toggle('disable');
}

/**
 * Change opacity of UI elements when network connection change.
 * @param {string} _status "enable", "disable"
 * */
MyUi.prototype.toggle = function(_status) {
    
    // ==========================
    // --- CSS class _online_ ---
    // ==========================
    
    var _items = document.querySelectorAll("._online_");
    for (var i = 0; i < _items.length; i++) {
        _MyUi._onclick(_items[i], _status);
    }
    
    // Small entries :
                
    if (!params.entries.displaySmallEntries) {
        _MyUi._smallEntries('hide');
    }
    
    // =======================
    // --- Settings screen ---
    // =======================
    
    // 1) Update settings message
                
    _MyUi.echo("onLine", _status, "");
}

/**
 * Output one html string in div element
 * 
 * @param {string} divId    : Div id element
 * @param {string} msg      : Html string to write
 * @param {string} placement: "append", "prepend", ""
 * */
MyUi.prototype.echo = function(divId, msg, placement) {
    var _out = document.getElementById(divId);
    if(!_out) { return; }
    
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

/**
 * Scroll main div to specified screen.
 * @param {screenX} int
 * 0 : Search feed
 * 1 : Feeds list
 * 2 : Entries list
 * 3 : Settings screen
 * 4 : Entry
 * */
MyUi.prototype._scrollTo = function(screenX) {
    if (params.settings.ui.animations) {
        _MyUi._smoothScrollTo(screenX, 250);
    } else {
        _MyUi._quickScrollTo(screenX);
    }
}

MyUi.prototype._quickScrollTo = function(screenX) {
    _sw = window.innerWidth * (screenX);
    window.scroll(_sw, 0);
}

// http://jsfiddle.net/DruwJ/92/
MyUi.prototype._smoothScrollTo = function (screenX, duration) {
    var timer, start, factor;

    target = window.innerWidth * (screenX);
    var offset = window.pageXOffset,
        delta = target - window.pageXOffset; // X-offset difference
    duration = duration || 1000; // default 1 sec animation
    start = Date.now(); // get start time
    factor = 0;

    if (timer) {
        clearInterval(timer); // stop any running animations
    }

    function step() {
        var x;
        factor = (Date.now() - start) / duration; // get interpolation factor
        if (factor >= 1) {
            clearInterval(timer); // stop animation
            factor = 1; // clip to max 1.0
        }
        x = factor * delta + offset;
        window.scrollBy(x - window.pageXOffset, 0);
    }

    timer = setInterval(step, 5);
    return timer;
};

/**
 * Show/Hide small entries
 * @param {string} status "hide" "show"
 * */
MyUi.prototype._smallEntries = function (status) {
    
    var _small_entries = document.querySelectorAll(".small");
    var _css = "";
    
    status == "show" ?
        _css = "display : block;" : _css = "display : none;";

    for (var i = 0; i < _small_entries.length; i++) {
        _small_entries[i].style.cssText = _css; 
    }
    
    // From status hide (unchecked) to status show (checked)
    // => Reset small entries opacity
    
    if (status == "show") {
        var _tmp = (navigator.onLine) ? "enable" : "disable";
        for (var i = 0; i < _small_entries.length; i++) {
            _MyUi._onclick(_small_entries[i], _tmp); 
        }
    }
};
    
