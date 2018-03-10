// -*- coding:utf-8-unix -*-

var buttonChanged = new Boolean( false );
var latestSerText = "";

// Search Web Page
var onButton = function( num ) {   
    if ( buttonChanged ) {
        buttonChanged = false;
    }
    
    let searchText = document.getElementById( "flatbutton" + String( num ) ).innerHTML;
    
    if ( latestSerText != searchText ) {
        buttonChanged = true;
    }
    latestSerText = searchText;
    
    browser.runtime.sendMessage({
        cmd: "find",
        toFind: searchText,
        flag: buttonChanged
    });
}

// Get Search String //////////////////////////////////////////////////////
let activeTabURL = String( window.location.href );
if ( activeTabURL.indexOf("www.google.") >= 0 && activeTabURL.indexOf("search?") >= 0 ) {
    // Get String from Search Page
    let url = new URL( activeTabURL );
    let params = url.searchParams.get( "q" );
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
        } else if ( paramsArray[i] === " " ) {
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
    AfterSearchArea.setAttribute( "class", "afarea-hover" );
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
    } else if ( message.cmd == "changeMode" ) {
        if ( document.getElementById( "aftersearcharea" ) != null ) {
            let modeStr = message.mode;
            if ( modeStr == "Enable" ) {
                document.getElementById( "aftersearcharea" ).setAttribute( "class", "afarea-hover" );
            } else if ( modeStr == "Disable" ) {
                document.getElementById( "aftersearcharea" ).setAttribute( "class", "afarea-off" );
            }
        }
    }
});


