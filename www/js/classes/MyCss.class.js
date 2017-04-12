/**
 * Copyright 2017 Thierry BUGEAT
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

/* ============= */
/* --- MyCss --- */
/* ============= */
   
var MyCss = function() {
    this.params = "";
    this.meta = { // Top header FFOS
        'orange': '#CD6723',
        'blue': '#004769',
        'grey': '#444444'
    };
    _MyCss = this;
}

/**
 * Set and apply CSS color theme
 * @param {object} _params
 */
MyCss.prototype.set = function(_params) {
    _MyCss.params = _params;

    _MyCss._remove('blue'); // @todo Use array _params['colors']
    _MyCss._remove('grey'); // @todo Use array _params['colors']

    document.getElementById('theme-color').content = this.meta[_params.selected]; // Top header FFOS

    if (_params.selected !== 'orange') {
        _MyCss._add(_params.selected);
    }
}

/**
 * Get CSS colors themes availables
 * @param {null}
 * @return {array}
 */
MyCss.prototype.colors = function() {
    return _MyCss.params.colors;
}

/**
 * Get CSS colors themes availables
 * @param {null}
 * @return {string}
 */
MyCss.prototype.selected = function() {
    return _MyCss.params.selected;
}

/**
 * Overwrite default theme colors ("orange")
 * @param {string} theme "blue"
 */
MyCss.prototype._add = function(theme) {
    var _head = document.getElementsByTagName("head")[0];
    var _cssNode = document.createElement('link');
    _cssNode.type = 'text/css';
    _cssNode.rel = 'stylesheet';
    _cssNode.href = 'css/themes/'+theme+'.css';
    _cssNode.media = 'screen'; 
    _cssNode.id = theme;
    _head.appendChild(_cssNode);
}

MyCss.prototype._remove = function(theme) {
    try{
        document.getElementById(theme).outerHTML = "";
    } catch(error) {
        // ---
    }
}
