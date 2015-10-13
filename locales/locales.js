var myDynamicsLocales = {
    
    "en": {
        "title": "English",
        "nb-days-ago": "{{n}} days ago",
        "by": "by"
    },
    
    "es": {
        "title": "Español",
        "nb-days-ago": "Hace {{n}} días", 
        "by": "por"
    },
    
    "fr": {
        "title": "Français",
        "nb-days-ago": "Il y a {{n}} jours", 
        "by": "par"
    },
    
    "pt": {
        "title": "Português",
        "nb-days-ago": "{{n}} dias atrás", 
        "by": "por"
    },
    
    "ru": {
        "title": "Pусский",
        "nb-days-ago": "{{n}} days ago",
        "by": "by"
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
