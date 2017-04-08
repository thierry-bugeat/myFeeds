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
    _MyCss = this;
}

/**
 * Overwrite default theme colors ("orange")
 * @param {string} theme "blue"
 */
MyCss.prototype.add = function(theme) {
    var _head = document.getElementsByTagName("head")[0];
    var _cssNode = document.createElement('link');
    _cssNode.type = 'text/css';
    _cssNode.rel = 'stylesheet';
    _cssNode.href = 'css/themes/'+theme+'.css';
    _cssNode.media = 'screen'; 
    _cssNode.id = theme;
    _head.appendChild(_cssNode);
}

MyCss.prototype.remove = function(theme) {
    document.getElementById(theme).outerHTML = "";
}
