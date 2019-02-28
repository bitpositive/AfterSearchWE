// -*- coding:utf-8-unix -*-

var ButtonChanged = new Boolean( false );
var LatestSerText = "";
var PressCount = 0;
var IsPositionSettingBottom = new Boolean( true );


// Search Web Page
var onButton = function( num ) {   
    if ( ButtonChanged ) {
        ButtonChanged = false;
    }
    
    let searchText = document.getElementById( "flatbutton" + String( num ) ).innerHTML;
    
    if ( LatestSerText != searchText ) {
        ButtonChanged = true;
    }
    LatestSerText = searchText;
    
    browser.runtime.sendMessage({
        cmd: "find",
        toFind: searchText,
        flag: ButtonChanged,
        height: document.documentElement.clientHeight,
        pageSize: document.documentElement.scrollHeight || document.body.scrollHeight
    });
}

// Remove highlights
var onRemoveButton = function() {
    browser.runtime.sendMessage({
        cmd: "removehighlights"
    });
}

// Get Position Setting ///////////////////////////////////////////////////////
function onError( error ) {
    console.log( `Error: ${error}` );
}

function onGotPosition( item ) {
    var position = "bottom";
    if ( item.position ) {
        position = item.position;
    }
    
    if ( position == "bottom" ) {
        IsPositionSettingBottom = true;
    } else {
        IsPositionSettingBottom = false;
    }
}

var getting = browser.storage.local.get( "position" );
getting.then( onGotPosition, onError );

// Get Search String //////////////////////////////////////////////////////
var activeTabURL = String( window.location.href );
var url = new URL( activeTabURL );
var params = "__aftersearch__noparam__";
if ( activeTabURL.indexOf("www.google.") >= 0 && activeTabURL.indexOf("/search?") >= 0 ) {
    // Get String from Search Page
    params = url.searchParams.get( "q" );
} else if ( activeTabURL.indexOf("www.bing.com") >= 0 && activeTabURL.indexOf("/search?") >= 0 ) {
    // Get String from Search Page
    params = url.searchParams.get( "q" );
} else if ( activeTabURL.indexOf("search.yahoo.") >= 0 && activeTabURL.indexOf("/search") >= 0 ) {
    // Get String from Search Page
    params = url.searchParams.get( "p" );
} else if ( activeTabURL.indexOf("duckduckgo.com/?") >= 0 ) {
    // Get String from Search Page
    params = url.searchParams.get( "q" );
} else if ( activeTabURL.indexOf("www.amazon.") >= 0 && activeTabURL.indexOf("search-alias") >= 0 ) {
    // Get String from Search Page
    params = url.searchParams.get( "field-keywords" );
} else if ( activeTabURL.indexOf("twitter.com/search?") >= 0 ) {
    // Get String from Search Page
    params = url.searchParams.get( "q" );
} else if ( activeTabURL.indexOf("wikipedia.org") >= 0 && activeTabURL.indexOf("?search") >= 0 ) {
    // Get String from Search Page
    params = url.searchParams.get( "search" );
}

if ( params != "__aftersearch__noparam__" ) {
    if ( ( params.split( "\"" ).length - 1 ) % 2 != 0 ) {
        params = params.replace( /\"/g, "" );
    }
    let paramsArray = params.split("");
    let searchStrs = [];
    let temp = "";
    let dQuoteRead = new Boolean( false );
    for ( var i = 0; i < paramsArray.length; i++ ) {
        if ( paramsArray[i] == "\"" ) {
            dQuoteRead = ( dQuoteRead === true ) ? false : true;
        }
        
        if ( i >= paramsArray.length - 1 ) {
            if ( paramsArray[i] !== "\"" ) {
                temp += paramsArray[i];
            }
            searchStrs.push( temp );         
        } else if ( dQuoteRead === true && paramsArray[i] !== "\"" ) {
            temp += paramsArray[i];
        } else if ( paramsArray[i] === " " ||  paramsArray[i] === "　") {
            searchStrs.push( temp );
            temp = "";
        } else if( paramsArray[i] !== "\"" ) {
            temp += paramsArray[i];
        }
    }
    
    for ( var i = searchStrs.length - 1; i >= 0 ; i-- ) {
        if ( searchStrs[i].charAt( 0 ) == "-" || searchStrs[i] == "" ) {
            searchStrs.splice( i, 1 );
        }
    }
    
    // Store String
    browser.runtime.sendMessage({
        cmd: "storeStrs",
        toStore: searchStrs
    });
}

// Create AfterSearch Bar /////////////////////////////////////////////////
if ( document.getElementById( "aftersearcharea" ) == null ) {
    let AfterSearchArea = document.createElement( "div" );
    AfterSearchArea.setAttribute( "id", "aftersearcharea" );
    if (IsPositionSettingBottom) {
        AfterSearchArea.setAttribute( "class", "afarea-bottom-hover" );
    } else {
        AfterSearchArea.setAttribute( "class", "afarea-top-hover" );
    }
    AfterSearchArea.setAttribute( "scrolling", "no" );
    // "AfterSearch" Label
    let Label = document.createElement( "p" );
    Label.setAttribute( "class", "aflabel" );
    Label.innerHTML = "&nbsp;&nbsp;AfterSearch&nbsp;";
    AfterSearchArea.appendChild( Label );
    document.body.appendChild( AfterSearchArea );

    browser.runtime.sendMessage({
        cmd: "createButtons"
    });
}

browser.runtime.onMessage.addListener( function( message, sender, sendResponse ) {
    if ( message.cmd == "createButtons" ) {
        if ( document.getElementById( "aftersearcharea" ) == null ) {
            let AfterSearchArea = document.createElement( "div" );
            AfterSearchArea.setAttribute( "id", "aftersearcharea" );
            if (IsPositionSettingBottom) {
                AfterSearchArea.setAttribute( "class", "afarea-bottom-hover" );
            } else {
                AfterSearchArea.setAttribute( "class", "afarea-top-hover" );
            }
            AfterSearchArea.setAttribute( "scrolling", "no" );
            // "AfterSearch" Label
            let Label = document.createElement( "p" );
            Label.setAttribute( "class", "aflabel" );
            Label.innerHTML = "&nbsp;&nbsp;AfterSearch&nbsp;";
            AfterSearchArea.appendChild( Label );
            document.body.appendChild( AfterSearchArea );
        }
        
        let strs = message.strings;
        // Create Buttons
        for ( var i = 0; i < strs.length; i++ ) {
            let button = document.createElement( "button" );
            button.textContent = strs[i];
            button.classList.add( "flatbutton" );
            button.setAttribute( "id", "flatbutton" + String(i) );
            button.onclick = function( ){ onButton( Number( String( this.id ).charAt(10) ) ); };
            document.getElementById( "aftersearcharea" ).appendChild( button );
        }
        
        // Create a remove highlight button
        let removebutton = document.createElement( "button" );
        removebutton.textContent = "Clear";
        removebutton.classList.add( "flatbutton_remove" );
        removebutton.setAttribute( "id", "flatbutton_aswe_removehighlight" );
        removebutton.onclick = function( ){ onRemoveButton(); }
        document.getElementById( "aftersearcharea" ).appendChild( removebutton );
    } else if ( message.cmd == "changeModeAFWE" ) {
        let afweMode = message.mode;
        if ( document.getElementById( "aftersearcharea" ) != null ) {
            if ( afweMode == 0 ) {
                // Default view: hover
                if (IsPositionSettingBottom) {
                    document.getElementById( "aftersearcharea" ).setAttribute( "class", "afarea-bottom-hover" );
                } else {
                    document.getElementById( "aftersearcharea" ).setAttribute( "class", "afarea-top-hover" );
                }
            } else if ( afweMode == 1 ) {
                // Second view: force shown
                if (IsPositionSettingBottom) {
                    document.getElementById( "aftersearcharea" ).setAttribute( "class", "afarea-bottom-shown" );
                } else {
                    document.getElementById( "aftersearcharea" ).setAttribute( "class", "afarea-top-shown" );
                }
            } else if ( afweMode == 2 ) {
                // Third view: force not to shown
                if (IsPositionSettingBottom) {
                    document.getElementById( "aftersearcharea" ).setAttribute( "class", "afarea-bottom-nottoshown" );
                } else {
                    document.getElementById( "aftersearcharea" ).setAttribute( "class", "afarea-top-nottoshown" );
                }
            }
        }
    }
});
