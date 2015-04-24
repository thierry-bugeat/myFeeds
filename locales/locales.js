var myDynamicsLocales = {
    
    "en": {
        "nb-days-ago": "{{n}} day(s) ago",
        "by": "by"
    },
    
    "es": {
        "nb-days-ago": "Hace {{n}} día(s)", 
        "by": "por"
    },
    
    "fr": {
        "nb-days-ago": "Il y a {{n}} jour(s)", 
        "by": "par"
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
