/* ========================= */
/* --- MyIndexedDb Class --- */
/* ========================= */

var MyIndexedDb = function() {
    
    this.db = '';

    _MyIndexedDb = this;
}

/* ================ */
/* --- Methodes --- */
/* ================ */

MyIndexedDb.prototype.open = function(params) {
    
    var databasename    = params['databaseName'];
    var tablename       = params['tableName'];
    var version         = params['version'];
    
    var _request        = indexedDB.open(databasename, version);
    
    _request.onsuccess = function (evt) {
        //this.db = this.result;
        _MyIndexedDb.db = this.result;
        console.log("idb.open.onsuccess");
        console.log(_MyIndexedDb.db);
        document.body.dispatchEvent(new CustomEvent('idb.open.onsuccess', {"detail": ""}));
    };
    
    _request.onerror = function (evt) {
        console.error("idb.open.onerror", evt.target);
        document.body.dispatchEvent(new CustomEvent('idb.open.onerror', {"detail": ""}));
    };

    /*
     * When the database version number increase, browser will fire 
     * "upgradeneeded" event. Any structural change like adding an 
     * object store or adding index to an object store must be made
     * in onupgradeneeded. If object store doesn't exits it will be
     * created. If object store exists browser will fire a contraint
     * error.
     * */
    _request.onupgradeneeded = function (evt) {
        console.log("idb.open.onupgradeneeded");
        
        try {
            console.log(evt);
            var _table = evt.currentTarget.result.createObjectStore( tablename, { keyPath: params['keyPath'] } );
            
            for (var key in params['indexs']) {
                console.log(key);
                _table.createIndex(key, key, { unique: params['indexs'][key]['unique'] });
            }
        } catch (e) {
            console.log(e);
        }
    };

}

/**
 * Select record(s) in table.
 * 
 * @param {string} _tablename
 * @param {string} _index Index name
 * @param {string} _value Index value
 *      "*" or ""         Select all records.
 *      "value"           Select record with specific value "value".
 *      "value1...value2" Select records between "value1" & "value2".
 *      "<=value"         Select records before "value" including "value".
 *      "<value"          Select records before "value" excluding "value".
 *      ">=value"         Select records after "value" including "value".
 *      ">value"          Select records after "value" excluding "value".
 *
 * Examples :
 *      select(DB_TABLE, "src", "*");
 *      select(DB_TABLE, "src", "http://linuxfr.org");
 *      select(DB_TABLE, "src", "http://france2.org...http://france4.org");
 *      select(DB_TABLE, "src", ">=http://france4.org");
 *      select(DB_TABLE, "src", ">http://france4.org");
 *      select(DB_TABLE, "src", "<=http://france4.org");
 *      select(DB_TABLE, "src", "<http://france4.org");
 *      select(DB_TABLE, "num", "<=30");
 * */
 
MyIndexedDb.prototype.select = function(_tablename, _index, _value, callback) {

    if (_value.match(/\.\.\./g)){
        var _values = _value.split("..."); 
        this._dbSelectRange(_tablename, _index, _values[0], _values[1], callback);
    } else if (_value.substr(0, 2) == "<=") {
        var _myValue = _value.substr(2, _value.length);
        this._dbSelectUpper(_tablename, _index, _myValue, false, callback);
    } else if (_value.substr(0, 1) == "<") {
        var _myValue = _value.substr(1, _value.length);
        this._dbSelectUpper(_tablename, _index, _myValue, true, callback);
    } else if (_value.substr(0, 2) == ">=") {
        var _myValue = _value.substr(2, _value.length);
        this._dbSelectLower(_tablename, _index, _myValue, false, callback);
    } else if (_value.substr(0, 1) == ">") {
        var _myValue = _value.substr(1, _value.length);
        this._dbSelectLower(_tablename, _index, _myValue, true, callback);
    } else if ((_value === "") || (_value == "*")) {
        this._dbSelectAll(_tablename, _index, callback);
    } else {
        this._dbSelectOnly(_tablename, _index, _value, callback);
    }
}

MyIndexedDb.prototype._dbSelectAll = function(_tablename, _index, callback) {
    var _results = [];
    var _table = this._getObjectStore(_tablename, 'readonly');
    var _range = null;
    
    _table.index(_index).openCursor(_range).onsuccess = function(event) {
        var _cursor = event.target.result;
        if (_cursor) {
            _results.push(_cursor.value);
            _cursor.continue();
        } else {
            console.log(_results);
            document.body.dispatchEvent(new CustomEvent('idb.select.onsuccess', {"detail": {"tablename": _tablename, "results": _results}}));
            callback(_results);
        }
    };
}

MyIndexedDb.prototype._dbSelectRange = function(_tablename, _index, _value1, _value2, callback) {
    var _results    = [];
    var _table      = this._getObjectStore(_tablename, 'readonly');
    var _range      = IDBKeyRange.bound(_value1, _value2, false, false);
    
    _table.index(_index).openCursor(_range).onsuccess = function(event) {
        var _cursor = event.target.result;
        if (_cursor) {
            _results.push(_cursor.value);
            _cursor.continue();
        } else {
            console.log(_results);
            document.body.dispatchEvent(new CustomEvent('idb.select.onsuccess', {"detail": {"tablename": _tablename, "results": _results}}));
            callback(_results);
        }
    };
}

MyIndexedDb.prototype._dbSelectOnly = function(_tablename, _index, _value, callback) {
    var _results    = [];
    var _table      = this._getObjectStore(_tablename, 'readonly');
    var _range      = IDBKeyRange.only(_value);
    
    _table.index(_index).openCursor(_range).onsuccess = function(event) {
        var _cursor = event.target.result;
        if (_cursor) {
            _results.push(_cursor.value);
            _cursor.continue();
        } else {
            console.log(_results);
            document.body.dispatchEvent(new CustomEvent('idb.select.onsuccess', {"detail": {"tablename": _tablename, "results": _results}}));
            callback(_results);
        }
    };
}

MyIndexedDb.prototype._dbSelectUpper = function(_tablename, _index, _value, _boolean, callback) {
    var _results    = [];
    var _table      = this._getObjectStore(_tablename, 'readonly');
    var _range      = IDBKeyRange.upperBound(_value, _boolean);
    
    _table.index(_index).openCursor(_range).onsuccess = function(event) {
        var _cursor = event.target.result;
        if (_cursor) {
            _results.push(_cursor.value);
            _cursor.continue();
        } else {
            console.log(_results);
            document.body.dispatchEvent(new CustomEvent('idb.select.onsuccess', {"detail": {"tablename": _tablename, "results": _results}}));
            callback(_results);
        }
    };
}

MyIndexedDb.prototype._dbSelectLower = function(_tablename, _index, _value, _boolean, callback) {
    var _results    = [];
    var _table      = this._getObjectStore(_tablename, 'readonly');
    var _range      = IDBKeyRange.lowerBound(_value, _boolean);
    
    _table.index(_index).openCursor(_range).onsuccess = function(event) {
        var _cursor = event.target.result;
        if (_cursor) {
            _results.push(_cursor.value);
            _cursor.continue();
        } else {
            console.log(_results);
            document.body.dispatchEvent(new CustomEvent('idb.select.onsuccess', {"detail": {"tablename": _tablename, "results": _results}}));
            callback(_results);
        }
    };
}

/**
 * @param {string} tablename
 * @param {string} id
 * @param {object} obj
 * 
 * Note :
 *     To do an update, "id" value must be the same in parameters "id" & "obj".
 *     If these 2 values are differents, a new entry will be create in 
 *     database (like an insert).
 * 
 * Example :
 * 
 *     update("myTableName", "email@email.com", {email: "email@email.com", name: "myName"});
 * 
 *     In this example, "email" is the key of the table.
 *     To do an update, emails values in 2nd and 3rd parameters must be the same.
 * */
MyIndexedDb.prototype.update = function(tablename, id, obj) {
    console.log("update arguments: ", arguments);

    var _table = this._getObjectStore(tablename, 'readwrite');
    
    var _request = _table.get(id);
    
    _request.onerror = function(event) {
        console.log('idb.update.onerror');
    };
    
    _request.onsuccess = function(event) {
        console.log('idb.update.onsuccess');
        //console.log(event);
        //console.log(_request.result);

        var _requestUpdate = _table.put(obj);
        
        _requestUpdate.onerror = function(event) {
            console.log('idb.update.onerror.requestUpdate');
        };
        
        _requestUpdate.onsuccess = function(event) {
            console.log('idb.update.onsuccess.requestUpdate');
        };
    };
    
}

MyIndexedDb.prototype._delete_ = function(_tablename, _value) {
    var _table = this._getObjectStore(_tablename, 'readwrite');
    var _request = _table.delete(_value);
    
    _request.onsuccess = function(event) {
        console.log('idb._delete_.onsuccess');
        document.body.dispatchEvent(new CustomEvent('idb._delete_.onsuccess', {"detail": {"tablename": _tablename, "value": _value}}));
    };
    
    _request.onerror = function(event) {
        console.error('idb._delete_.onerror');
        document.body.dispatchEvent(new CustomEvent('idb._delete_.onerror', {"detail": {"tablename": _tablename, "value": _value}}));
    };
    
}

MyIndexedDb.prototype.deleteAll = function(_tablename) {
    console.log("MyIndexedDb.prototype.deleteAll()", arguments);
    this._delete_(_tablename, "");
    
}

MyIndexedDb.prototype.deleteDatabase = function(_databasename) {

    var _request = indexedDB.deleteDatabase(_databasename);
    
    _request.onsuccess = function () {
        console.log('idb.deleteDatabase.onsuccess');
        document.body.dispatchEvent(new CustomEvent('idb.deleteDatabase.onsuccess', {"detail": {"databasename": _databasename}}));
    };
    
    _request.onerror = function () {
        console.log('idb.deleteDatabase.onerror');
        document.body.dispatchEvent(new CustomEvent('idb.deleteDatabase.onerror', {"detail": {"databasename": _databasename}}));
    };
    
    _request.onblocked = function () {
        console.log('idb.deleteDatabase.onblocked');
        document.body.dispatchEvent(new CustomEvent('idb.deleteDatabase.onblocked', {"detail": {"databasename": _databasename}}));
    };
}

MyIndexedDb.prototype.insertV0 = function(tablename, obj) {
    console.log("insert arguments: ", arguments);
    
    if (typeof blob != 'undefined') { obj.blob = blob; }

    var _table = this._getObjectStore(tablename, 'readwrite');
    
    var _request = _table.add(obj);
    
    _request.onsuccess = function (evt) {
        console.log("idb.insert.onsuccess");
    };
    
    _request.onerror = function() {
        console.error("idb.insert.onerror", this.error);
    };
}

MyIndexedDb.prototype.insert = function(tablename, obj) {
    console.log("insert arguments: ", arguments);
    this.update(tablename, "", obj);
}

/**
 * @param {string} store_name
 * @param {string} mode either "readonly" or "readwrite"
 */
MyIndexedDb.prototype._getObjectStore = function(store_name, mode) {
    var tx = this.db.transaction(store_name, mode);
    return tx.objectStore(store_name);
}
