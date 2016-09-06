/**
 * Copyright 2016 Thierry BUGEAT
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

/* ================================= */
/* --- Listeners SimplePie Class --- */
/* ================================= */

var MyListeners_SimplePie = function() {

        document.body.addEventListener('SimplePie.load.done', function(event){
            
            liveValues.sync.nbFeedsLoaded++;
            
            my.log('SimplePie.load.done '+liveValues.sync.nbFeedsLoaded+'/'+liveValues.sync.nbFeedsToLoad);
            
            // Save feed as file

            if (liveValues.network.status == 'online') {
                my._save('cache/simplepie/feeds/' + event.detail._myParams.account + "/" + btoa(event.detail.feedUrl) + ".json", "application/json", JSON.stringify(event.detail)).then(function(results) {
                    my.log('SimplePie.load.done > Saving feed in cache ok : ' + event.detail.feedUrl + ' (' + event.detail._myParams.account + "/" + btoa(event.detail.feedUrl) + ')');
                }).catch(function(error) {
                    my.error("ERROR saving feed in cache : " + event.detail.feedUrl + ' (' + event.detail._myParams.account + "/" + btoa(event.detail.feedUrl) + ') ' + error);
                    my.alert("ERROR saving feed in cache :\n" + event.detail.feedUrl);
                });
            }

            // Add feed entries to array "unsortedEntries"

                sp.addFeed(event.detail);

            // Check if all feeds were loaded


                // Percentage of loading ?

                ui._loading(Math.round((100 * liveValues.sync.nbFeedsLoaded) / liveValues.sync.nbFeedsToLoad));

                // ---

                if (liveValues.sync.nbFeedsLoaded == liveValues.sync.nbFeedsToLoad) {
                    if (params.entries.nbDaysAgo == 0) {
                        dspEntries();
                    }
                    dspFeeds(sp.getFeeds());
                    updateFeedsPulsations();
                }
                
                if (liveValues.sync.nbFeedsLoaded >= liveValues.sync.nbFeedsToLoad) {
                    liveValues.sync.inProgress = false;
                    liveValues.sync.nbFeedsToLoad = 0;
                    liveValues.sync.nbFeedsLoaded = 0;
                    ui._loading(100); ui.echo("loading", "", "");
                    if (liveValues.network.status == 'online') {
                        ui._onclick(sync, 'enable');
                    }
                }

            // ---

        }, true);

        document.body.addEventListener('SimplePie.load.error', function(event){
            
            liveValues.sync.nbFeedsLoaded++;
            
            my.error('SimplePie.load.error '+liveValues.sync.nbFeedsLoaded+'/'+liveValues.sync.nbFeedsToLoad);
            
            // Check if all feeds were loaded

                my.error(event);

                // Percentage of loading ?

                ui._loading(Math.round((100 * liveValues.sync.nbFeedsLoaded) / liveValues.sync.nbFeedsToLoad));

                // ---

                if (liveValues.sync.nbFeedsLoaded == liveValues.sync.nbFeedsToLoad) {
                    if (params.entries.nbDaysAgo == 0) {
                        dspEntries();
                    }
                    dspFeeds(sp.getFeeds());
                    updateFeedsPulsations();
                }
                
                if (liveValues.sync.nbFeedsLoaded >= liveValues.sync.nbFeedsToLoad) {
                    liveValues.sync.inProgress = false;
                    liveValues.sync.nbFeedsToLoad = 0;
                    liveValues.sync.nbFeedsLoaded = 0;
                    ui._loading(100); ui.echo("loading", "", "");
                    if (liveValues.network.status == 'online') {
                        ui._onclick(sync, 'enable');
                    }
                }

            // ---

        }, true);

        document.body.addEventListener('SimplePie.isValidUrl.done', findFeedsDisplayResults, true);

        document.body.addEventListener('SimplePie.isValidUrl.error', function(){
            ui.echo("find-feeds", "Invalid URL", "");
        }, true);

}

