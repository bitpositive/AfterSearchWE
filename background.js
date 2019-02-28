// -*- coding:utf-8-unix -*-

var ButtonPosOffset = 23;
var ScrollOffset = 180;
var AsweMode = 0;

function found( flag, height, pageSize, findResults ) {
    var results = findResults;
    browser.tabs.query( {active: true, currentWindow: true}, function( tabs ){
        var id = tabs.shift().id;
        browser.storage.local.get( [String( id ) + "_count"], function( item ) {
            if ( results.count > 1 ) {
                var count = item[String( id ) + "_count"];
                
                browser.find.highlightResults();
                
                if ( flag ) {  // search text was changed
                    count = 0;

                    // create a scroll postion list
                    let poses = [];
                    var tempPos = 0;
                    for (var i = 0; i < results.rectData.length; i++) {
                        if ( results.rectData[i].rectsAndTexts.rectList[0] != void 0 ) {
                            var pos = results.rectData[i].rectsAndTexts.rectList[0].top;                        
                            if ( i == 0 || ( pos != tempPos && pos > ScrollOffset && pos < pageSize - ( height - ScrollOffset ) && ( pos > height - ButtonPosOffset + 5 || pos < height - ButtonPosOffset - 5 ) ) ) {
                                poses.push( pos );
                            }
                            tempPos = pos;                            
                        }
                    }
                    poses.sort(function(a,b){
                        if( a < b ) return -1;
                        if( a > b ) return 1;
                        return 0;
                    });
                    
                    browser.storage.local.remove( [String( id ) + "_poses"], function() {} );
                    var data2 = {};
                    data2[String(id) + "_poses"] = poses;
                    browser.storage.local.set( data2, function() {} );
                    
                }
                
                browser.storage.local.get( [String( id ) + "_poses"], function( item2 ) {
                    // get the scroll position list
                    var poses = item2[String( id ) + "_poses"];
                    
                    var top = poses[count] - ScrollOffset;
                    browser.tabs.executeScript({
                        code: "window.scrollTo( 0, " + top + " );"
                    });
                    
                    count++;
                    if ( count > poses.length - 1 ) {
                        count = 0;
                    }

                    browser.storage.local.remove( [String( id ) + "_count"], function() {} );
                    var data = {};
                    data[String(id) + "_count"] = count;
                    browser.storage.local.set( data, function() {} );
                } );
            }
        } );
    } );
}

function store( toStore, result ) {
    let id = result.shift().id;
    browser.storage.local.remove( [String( id ) + "_str"], function() {} );
    let data = {};
    data[String(id) + "_str"] = toStore;
    browser.storage.local.set( data, function() {} );
}

function createBtn( result ) {
    let id = result.shift().id;
    
    browser.storage.local.get( [String( id ) + "_str"], function( item ) {
        let strs = item[String( id ) + "_str"];
        if ( strs != void 0 ) {
            let message = {
                cmd: "createButtons",
                strings: strs
            };
            browser.tabs.sendMessage( id, message, function() {} );
        }
    } );
}

browser.runtime.onMessage.addListener( function( req, sender, response ) {
    if( req.cmd == "find" ){
        browser.find.find( req.toFind, {includeRectData: true} ).then( found.bind( this, req.flag, req.height, req.pageSize) );
        return true;
    } else if ( req.cmd == "storeStrs" ) {
        browser.tabs.query( {active: true, currentWindow: true} ).then( store.bind( this, req.toStore ) );
        return true;
    } else if ( req.cmd == "createButtons" ) {
        browser.tabs.query( {active: true, currentWindow: true} ).then( createBtn.bind( this ) );
        return true;
    } else if ( req.cmd == "removehighlights" ) {
        browser.tabs.query( {active: true, currentWindow: true} ).then( browser.find.removeHighlighting() );
    }
});

// タブを閉じるとき
browser.tabs.onRemoved.addListener( function( tabId, info ) {
    browser.storage.local.remove( [String( tabId ) + "_str"], function() {} );
    browser.storage.local.remove( [String( tabId ) + "_count"], function() {} );

    let data = {};
    data["AsweMode"] = AsweMode;
    browser.storage.local.set( data, function() {} );
});

// タブを開くとき
browser.tabs.onCreated.addListener( function( tab ) {
    browser.storage.local.remove( [String( tab.id ) + "_str"], function() {} );
    browser.storage.local.remove( [String( tab.id ) + "_count"], function() {} );
    
    if ( tab.openerTabId != void 0 ) {        
        browser.storage.local.get( [String( tab.openerTabId ) + "_str"], function( item ) {
            let strs = item[String( tab.openerTabId ) + "_str"];
            let data = {};
            data[String(tab.id) + "_str"] = strs;
            browser.storage.local.set( data, function() {} );
        } );
    }
    
    browser.storage.local.get( ["AsweMode"], function( item ) {
        if ( typeof item["AsweMode"] != 'string' ) {
            let data = {};
            data["AsweMode"] = 0;
            browser.storage.local.set( data, function() {} );

            AsweMode = data["AsweMode"];
        } else {
            AsweMode = item["AsweMode"];
        }
        
    } );
});

browser.tabs.onUpdated.addListener( function( tabId, info,  urls = ["http://*/*", "https://*/*", "ftp://*/*" ] ) {
    if ( info.status == "complete" ) {
        // Change mode when switched tabs
        let message = {
            cmd: "changeModeAFWE",
            mode: AsweMode
        };
        browser.tabs.sendMessage( tabId, message, function() {} );
    }
});

// Change mode of AFWE
function changeModeAFWE( result ) {
    let id = result.shift().id;
    let message = {
        cmd: "changeModeAFWE",
        mode: AsweMode
    };
    browser.tabs.sendMessage( id, message, function() {} );
}

function updateIcon() {
    if ( AsweMode == 0 ) {
        browser.browserAction.setTitle({title: "Mode: Mouseover"});
        browser.browserAction.setIcon(
            {
                path: {
                    48: "icons/ASWE_icon_normal_48.png",
                    96: "icons/ASWE_icon_normal_96.png"
                }
            }
        );
    } else if ( AsweMode == 1 ) {
        browser.browserAction.setTitle({title: "Mode: Always Shown"});
        browser.browserAction.setIcon(
            {
                path: {
                    48: "icons/ASWE_icon_shown_48.png",
                    96: "icons/ASWE_icon_shown_96.png"
                }
            }
        );
    } else if ( AsweMode == 2 ) {
        browser.browserAction.setTitle({title: "Mode: Disable"});
        browser.browserAction.setIcon(
            {
                path: {
                    48: "icons/ASWE_icon_disable_48.png",
                    96: "icons/ASWE_icon_disable_96.png"
                }
            }
        );
    }
}

browser.browserAction.onClicked.addListener( function() {
    if ( AsweMode < 2 ) {
        AsweMode = AsweMode + 1;
    } else {
        AsweMode = 0;
    }
    updateIcon();
    browser.tabs.query( {active: true, currentWindow: true} ).then( changeModeAFWE.bind( this ) );
    
});

