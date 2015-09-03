/*
 * Functions and classes available to Web Workers :
 * https://developer.mozilla.org/en-US/docs/Web/API/Worker/Functions_and_classes_available_to_workers
 * 
 * Custom event :
 * https://developer.mozilla.org/fr/docs/Web/API/CustomEvent
 * */

importScripts('/scripts/classes/MyFeeds.class.js', '/scripts/classes/MyFeeds/GoogleFeed.class.js', '/libs/sha256.js', '/libs/myCore.js');

var gf = new GoogleFeed();
var my = new MyFeeds();

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
            self.close(); // Terminates the worker.
            break;
        case 'loadFeeds':
            myFeedsSubscriptions = data.myFeedsSubscriptions;
            MyFeeds.params = data.params;
            my.log('worker > myFeedsSubscriptions', myFeedsSubscriptions);
            gf.setFeedsSubscriptions(myFeedsSubscriptions);
            my.log('worker > gf.loadFeeds ' + MyFeeds.params.entries.dontDisplayEntriesOlderThan + ' day(s)');
            gf.loadFeeds(MyFeeds.params.entries.dontDisplayEntriesOlderThan);
            self.postMessage('worker > todo');
        default:
            self.postMessage('worker unknown command');
    };
    
}, false);

/* ===================== */
/* --- Google Events --- */
/* ===================== */

self.addEventListener('bugeat', function(event){

    my.log('bugeatr > thierry');

    // ---

}, true);

self.addEventListener('GoogleFeed.load.done', function(event){

    my.log('worker > ICI', event);

    // Save feed as file

    /*if (navigator.onLine) {
        my._save('cache/google/feeds/' + btoa(event.detail.responseData.feed.feedUrl) + ".json", "application/json", JSON.stringify(event.detail.responseData.feed)).then(function(results) {
            my.log('GoogleFeed.load.done > Saving feed in cache ok : ' + event.detail.responseData.feed.feedUrl + ' ('+btoa(event.detail.responseData.feed.feedUrl)+')');
        }).catch(function(error) {
            my.error("ERROR saving feed in cache : " + event.detail.responseData.feed.feedUrl + ' ('+btoa(event.detail.responseData.feed.feedUrl)+')');
            my.alert("ERROR saving feed in cache :\n" + event.detail.responseData.feed.feedUrl);
        });
    }*/

    // Add feed entries to array "unsortedEntries"

        //gf.addFeed(event.detail.responseData.feed); // ????? comment faire ?????

    // Check if all feeds were loaded

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

        // ---

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
        }

    // ---

}, true);   

self.addEventListener('GoogleFeed.load.error222', function(event){

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
            _saveSubscriptions(false);
        }

        if (_nbFeedsLoaded >= _nbFeedsToLoad) {
            ui._loading(100); ui.echo("loading", "", "");
            if (navigator.onLine) {
                ui._onclick(sync, 'enable');
            }
        }

    // ---

}, true);

