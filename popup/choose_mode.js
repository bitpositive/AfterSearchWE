// -*- coding: utf-8 -*-

function sendMegChMode( text, result ) {
    let id = result.shift().id;
    let message = {
        cmd: "changeMode",
        mode: text
    };
    browser.tabs.sendMessage( id, message, function() {});
}

document.addEventListener( "click", function( e ) {
    if ( !( e.target.className == "mode-hover" || e.target.className == "mode-off" ) ) {
        return;
    }
    
    let modeText = e.target.textContent;
    
    browser.tabs.query( {currentWindow: true, active: true} ).then( sendMegChMode.bind( this, modeText ) );
} );

