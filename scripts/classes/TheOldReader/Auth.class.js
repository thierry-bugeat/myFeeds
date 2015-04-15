
/* ================================= */
/* --- Auth extends TheOldReader --- */
/* ================================= */

var Auth = function() {

    TheOldReader.call(this); /* Appel du constructeur de la classe parente */

    this.auth = {
        "useLocalStorage" : false
    };

    _Auth = this;

}
Auth.prototype = new TheOldReader();

Auth.prototype.useLocalStorage = function()
{
    return this.auth.useLocalStorage;
}

Auth.prototype.getTest = function()
{
    return this.getTorVersion();
}
