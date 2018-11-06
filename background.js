// -*- coding:utf-8-unix -*-

var buttonPosOffset = 23;
var scrollOffset = 180;
var afweMode = 0;

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
                            if ( i == 0 || ( pos != tempPos && pos > scrollOffset && pos < pageSize - ( height - scrollOffset ) && pos != height - buttonPosOffset ) ) {
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
                    
                    var top = poses[count] - scrollOffset;
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
    }
});

// タブを閉じる際に検索文字列も消去する
browser.tabs.onRemoved.addListener( function( tabId, info ) {
    browser.storage.local.remove( [String( tabId ) + "_str"], function() {} );
    browser.storage.local.remove( [String( tabId ) + "_count"], function() {} );
});
// タブを開く際にも検索文字列を消去する
browser.tabs.onCreated.addListener( function( tabId, info ) {
    browser.storage.local.remove( [String( tabId ) + "_str"], function() {} );
    browser.storage.local.remove( [String( tabId ) + "_count"], function() {} );
});

browser.tabs.onUpdated.addListener( function( tabId, info,  urls = ["http://*/*", "https://*/*", "ftp://*/*" ] ) {
    if ( info.status == "complete" ) {
        // Change mode when switched tabs
        let message = {
            cmd: "changeModeAFWE",
            mode: afweMode
        };
        browser.tabs.sendMessage( tabId, message, function() {} );
    }
});

// Change mode of AFWE
function changeModeAFWE( result ) {
    let id = result.shift().id;
    let message = {
        cmd: "changeModeAFWE",
        mode: afweMode
    };
    browser.tabs.sendMessage( id, message, function() {} );
}

function updateIcon() {
    if ( afweMode == 0 ) {
        browser.browserAction.setTitle({title: "Mode: Mouseover"});
        browser.browserAction.setIcon(
            {
                path: {
                    48: "icons/aftersearchwe_icon_default_48.png",
                    96: "icons/aftersearchwe_icon_default_96.png"
                }
            }
        );
    } else if ( afweMode == 1 ) {
        browser.browserAction.setTitle({title: "Mode: Always Shown"});
        browser.browserAction.setIcon(
            {
                path: {
                    48: "icons/aftersearchwe_icon_green_48.png",
                    96: "icons/aftersearchwe_icon_green_96.png"
                }
            }
        );
    } else if ( afweMode == 2 ) {
        browser.browserAction.setTitle({title: "Mode: Disable"});
        browser.browserAction.setIcon(
            {
                path: {
                    48: "icons/aftersearchwe_icon_red_48.png",
                    96: "icons/aftersearchwe_icon_red_96.png"
                }
            }
        );
    }
}

browser.browserAction.onClicked.addListener( function() {
    if ( afweMode < 2 ) {
        afweMode = afweMode + 1;
    } else {
        afweMode = 0;
    }
    updateIcon();
    browser.tabs.query( {active: true, currentWindow: true} ).then( changeModeAFWE.bind( this ) );
    
});

