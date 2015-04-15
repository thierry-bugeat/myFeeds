
/* ========================== */
/* --- TheOldReader Class --- */
/* ========================== */

var TheOldReader = function() {

    this.tor = {
        "version"       : "v13_6",
        "format"        : "json"
    };

    _TheOldReader = this;
}

/* ================ */
/* --- Methodes --- */
/* ================ */

TheOldReader.prototype.getTorVersion   = function(){ return this.tor.version; }
TheOldReader.prototype.getTorFormat    = function(){ return this.tor.format; }

TheOldReader.prototype._curl = function(ajax_url)
{

    $.ajax({
        type: "GET",
        url: ajax_url + '&callback=?',
        context: this,
        dataType: "jsonp",
        async: true,
        jsonpCallback: "_ProductSearch.alert222",
        success: function(data) {
            //console.log(data);
            $('body').trigger('ajaxOK','');
            $('body').trigger(callback,data);
        },
        error: function (xhr, textStatus, errorThrown) {
            window.console && console.log("xhr.status: " + xhr.status);
            window.console && console.log("xhr.statusText: " + xhr.statusText);
            window.console && console.log("xhr.readyState: " + xhr.readyState);
            window.console && console.log("xhr.responseText: " + xhr.responseText);
            window.console && console.log("xhr.responseXML: " + xhr.responseXML);
            window.console && console.log("textStatus: " + textStatus);
            window.console && console.log("errorThrown: " + errorThrown);
            window.console && console.log("xhr.redirect: " + xhr.redirect);
        },
        statusCode: {
            404: function () { window.console && console.log("404"); },
            501: function () { window.console && console.log("501"); },
            502: function () { window.console && console.log("502"); }
        }

    });

}
