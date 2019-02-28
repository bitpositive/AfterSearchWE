// -*- coding:utf-8-unix -*-

function saveOptions() {    
    var positionFromRadio;
    var radios = document.getElementsByName( "position" );
    
    for( var i = 0; i < radios.length; i++ ){
        if( radios[i].checked ){
            positionFromRadio = radios[i].value;
        }
    }
    
    browser.storage.local.set( {
        position: positionFromRadio
    } );
}

function restoreOptions() {
    function setCurrentChoice( result ) {
        var radios = document.getElementsByName( "position" );
        
        for( var i = 0; i < radios.length; i++ ){
            if( radios[i].value == result.position ){
                radios[i].checked = true;
            }
        }
    }
    
    function onError( error ) {
        console.log( `Error: ${error}` );
    }

    var getting = browser.storage.local.get( "position" );
    getting.then( setCurrentChoice, onError );
}

document.addEventListener( "DOMContentLoaded", restoreOptions );
document.getElementById( 'save' ).addEventListener( 'click', saveOptions );
