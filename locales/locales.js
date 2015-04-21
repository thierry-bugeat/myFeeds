var myDynamicsLocales = {
    
    "en": {
        "nb-days-ago": "{{n}} day(s) ago"
    },
    
    "es": {
        "nb-days-ago": "Hace {{n}} día(s)"
    },
    
    "fr": {
        "nb-days-ago": "Il y a {{n}} jour(s)"
    }

};

// Keep only user locale.

var userLocale = navigator.language || navigator.userLanguage;
var myExtraTranslations = {};

if (myDynamicsLocales[userLocale] !== undefined) {
    myExtraTranslations = myDynamicsLocales[userLocale];
} else {
    myExtraTranslations = myDynamicsLocales['en'];
}

// console.log(myExtraTranslations);
