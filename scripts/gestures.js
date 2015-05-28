/**
 * Example : https://developer.mozilla.org/en-US/docs/Web/API/Touch_events#Example
 * */

function _swipe(callback) {
    myGesture = new Object();
    
    myGesture._startX       = 0;
    myGesture._startY       = 0;
    myGesture._endX         = 0;
    myGesture._endY         = 0;
    myGesture._action       = "";
    myGesture._scrollTop    = false;
    
    var _element = document.getElementById("feeds-entries");
    
    var direction = "";
    
    _element.addEventListener("touchstart", function(event) {
        //event.preventDefault();
        direction = "";
        var _t = event.touches[0];
        myGesture._startX = _t.screenX;
        myGesture._startY = _t.screenY;
        
        // (1) Sync
        
        if (document.getElementById('feeds-entries').scrollTop == 0) {
            myGesture._scrollTop = true;
        }
        
    }, false);
    
    _element.addEventListener('touchmove', function(event) {

        var direction = _getDirection(myGesture);
        var t = event.touches[0];
        
        myGesture._endX = t.screenX;
        myGesture._endY = t.screenY;
        
        // (1) Sync
        
        if ((direction == "down") && (myGesture._scrollTop)) {
            var _top = 3 + (Math.abs(myGesture._startY - myGesture._endY) / 15);
            if (_top >= 10) { 
                _top = 10; 
                myGesture._action = 'sync';
            } else {
                myGesture._action = '';
            }
        }
        
    }, false);
    
    _element.addEventListener('touchend', function(event) {
        
        direction = _getDirection(myGesture);
        
        // ===============
        // --- Results ---
        // ===============
        
        // Sync : Launch a sync if no synchro is in progress
        
        if ((myGesture._action == "sync") && (sync.style.pointerEvents == 'auto')) {
            _onclick(sync, 'disable');
            echo("feeds-list", "Loading...", ""); 
            gf.loadFeeds(params.entries.dontDisplayEntriesOlderThan);
        }
        
        // ---

        if (direction != "") {
            
            console.log("Direction : " + direction);

            if (typeof callback == 'function') {
                callback(_element, direction);
            }
        }
        
        myGesture._startX       = 0;
        myGesture._startY       = 0;
        myGesture._endX         = 0;
        myGesture._endY         = 0;
        myGesture._action       = "";
        myGesture._scrollTop    = false;

        direction   = "";
        
    }, false); 
    
}

function _getDirection(_myGesture) {
    
    var _minX = 40;  // Min X swipe for horizontal swipe
    var _minY = 30;  // Min Y swipe for vertical swipe
    
    var _distanceX = 0;
    var _distanceY = 0;
    var _direction = "";
    
    _distanceX = Math.abs(_myGesture._startX - _myGesture._endX); 
    _distanceY = Math.abs(_myGesture._startY - _myGesture._endY); 
    
    // Horizontal detection
    
    if ((_distanceX > _distanceY) && (_distanceX > _minX)) {
            
        if (_myGesture._endX > _myGesture._startX) {
            _direction = "right";
        } else { 
            _direction = "left";
        }

    }
        
    // Vertical gesture
    
    else if ((_distanceY > _distanceX) && (_distanceY > _minY)) {
        
        if (_myGesture._endY > _myGesture._startY) {
            _direction = "down";
        } else {
            _direction = "up";
        }
        
    }
    
    return _direction;
}
