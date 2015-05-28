var myDynamicsLocales = {
    
    "en": {
        "nb-days-ago": "{{n}} days ago",
        "by": "by"
    },
    
    "es": {
        "nb-days-ago": "Hace {{n}} días", 
        "by": "por"
    },
    
    "fr": {
        "nb-days-ago": "Il y a {{n}} jours", 
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
