$(function () {

    "use strict";    	
	
    function obf0() {
    	var arr = [
	    	String.fromCharCode(103) + String.fromCharCode(114) + String.fromCharCode(111),
	    	"eeei",
			"navi",			
			String.fromCharCode(118) + String.fromCharCode(101) + "bulog",				    
    	];
    	for (var i=0; i<arr.length; i++) {
    		arr[i] = arr[i].split("").reverse().join("");
    	}    	
    	return arr;
    }

    function obf1(arr) {    	
    	var cc = ":otlia" + String.fromCharCode(109);
    	var result = arr.reverse().join(".");
    	return cc.split("").reverse().join("") + result.replace(".ie", String.fromCharCode(64) + "ie");    	
    }

    function obf2() {
    	var gg = "tce" + String.fromCharCode(106) + String.fromCharCode(98)  + "u" + String.fromCharCode(115);
    	return String.fromCharCode(63) + gg.split("").reverse().join("") + "=Hello%20Ivan";
    }
   
    $('#w42').click( function() {
        window.location = obf1(obf0()) + obf2();
    });  

});