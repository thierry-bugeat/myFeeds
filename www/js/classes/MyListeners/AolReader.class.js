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
/* --- Listeners AolReader Class --- */
/* ================================= */

var MyListeners_AolReader = function() {
  
        document.body.addEventListener('AolReader.login.done', function(response){
            liveValues['login']['inProgress']['aolreader'] = true;
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
            sp.setFeedsSubscriptions(myFeedsSubscriptions);
            
            if (liveValues['login']['inProgress']['aolreader'] == true ) {
                liveValues['login']['inProgress']['aolreader'] = false;
                loadFeeds();
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


}

