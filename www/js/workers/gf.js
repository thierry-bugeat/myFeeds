/*
 * Using web workers :
 * https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers
 * 
 * Functions and classes available to Web Workers :
 * https://developer.mozilla.org/en-US/docs/Web/API/Worker/Functions_and_classes_available_to_workers
 * 
 * Custom event :
 * https://developer.mozilla.org/fr/docs/Web/API/CustomEvent
 * */

importScripts('/scripts/classes/MyFeeds.class.js', '/scripts/classes/MyFeeds/GoogleFeed.class.js', '/libs/sha256.js', '/libs/myCore.js');

var gf = new GoogleFeed();
var my = new MyFeeds();

//var manifest = my._loadJSON('manifest.webapp'); console.log(manifest);

var myFeedsSubscriptions;
    
self.addEventListener('message', function(e) {
    var data = e.data;
    
    switch (data.cmd) {
        case 'start':
            my.log('Posting message back to main script : ' + data.msg);
            self.postMessage('Worker STARTED: ' + data.msg);
            break;
        case 'stop':
            my.log('Posting message back to main script : ' + data.msg);
            self.postMessage('Worker STOPPED: ' + data.msg);
            self.close();
            break;
        case 'loadFeeds':
            myFeedsSubscriptions = data.myFeedsSubscriptions;
            MyFeeds.params = data.params;
            my.log('worker > myFeedsSubscriptions', myFeedsSubscriptions);
            gf.setFeedsSubscriptions(myFeedsSubscriptions);
            my.log('worker > gf.loadFeeds ' + MyFeeds.params.entries.dontDisplayEntriesOlderThan + ' day(s)');
            gf.loadFeeds(MyFeeds.params.entries.dontDisplayEntriesOlderThan);
            break;
        default:
            self.postMessage('worker unknown command');
    };
    
}, false);

/* ===================== */
/* --- Google Events --- */
/* ===================== */

self.addEventListener('GoogleFeed.load.done', function(event){

    // Check if all feeds have been loaded

    var _nbFeedsToLoad = gf.getNbFeeds();
    var _nbFeedsLoaded = gf.getNbFeedsLoaded();
    gf.setNbFeedsLoaded(++_nbFeedsLoaded);
    
    // Percentage of loading ?
    
    my.log('worker > ' + _nbFeedsLoaded + '/' + _nbFeedsToLoad);
    
    self.postMessage({
        "cmd": "updateLoading",
        "data": {
            "percentage": Math.round((_nbFeedsLoaded/_nbFeedsToLoad)*100)
        }
    });

    // All feeds have been loaded

    if (_nbFeedsLoaded == _nbFeedsToLoad) {
        self.postMessage({
            "cmd": "end",
            "entries": gf.getEntries(),
            "feeds": gf.getFeeds()
        });
    }

    if (_nbFeedsLoaded >= _nbFeedsToLoad) {
        self.postMessage({
            "cmd": "updateLoading",
            "data": {
                "percentage": 100
            }
        });
        self.postMessage({
            "cmd": "enableWorkerSync",
            "data": {}
        });
    }

}, true);   

self.addEventListener('GoogleFeed.load.error', function(event){

    // Check if all feeds have been loaded

    var _nbFeedsToLoad = gf.getNbFeeds();
    var _nbFeedsLoaded = gf.getNbFeedsLoaded();
    gf.setNbFeedsLoaded(++_nbFeedsLoaded);
    
    // Percentage of loading ?
    
    my.log('worker > ' + _nbFeedsLoaded + '/' + _nbFeedsToLoad);
    
    self.postMessage({
        "cmd": "updateLoading",
        "data": {
            "percentage": Math.round((_nbFeedsLoaded/_nbFeedsToLoad)*100)
        }
    });

    // All feeds have been loaded

    if (_nbFeedsLoaded == _nbFeedsToLoad) {
        self.postMessage({
            "cmd": "end",
            "entries": gf.getEntries(),
            "feeds": gf.getFeeds()
        });
    }

    if (_nbFeedsLoaded >= _nbFeedsToLoad) {
        self.postMessage({
            "cmd": "updateLoading",
            "data": {
                "percentage": 100
            }
        });
        self.postMessage({
            "cmd": "enableWorkerSync",
            "data": {}
        });
    }

}, true);

