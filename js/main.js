$(function () {

    "use strict";    	
	
    function obf0() {
    	var arr = [
            [103, 114, 111].map(obf4).join(""),	    	
	    	"eeei",
			"navi",			
			[118, 101].map(obf4).join("") + "bulog",				    
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
    	var gg = "tce" + [106, 98].map(obf4).join("")  + "u" + String.fromCharCode(115);
    	return String.fromCharCode(63) + gg.split("").reverse().join("") + "=Hello%20Ivan";
    }
   
    $('#w42').click( function() {
        window.location = obf1(obf0()) + obf2();
    }); 

    function obf4(x){
        return String.fromCharCode(x); 
    }

    function obf3() {
        return "skype:live:" 
        + ["spb", [103, 111, 108, 117, 98, 101, 118].map(obf4).join(""), "ivan"].reverse().join(".") 
        + "?chat";
    }

    $('#skype').click( function() {
        window.location = obf3();        
    });     
        
    // adding tooltips    
    $("#cv").tooltip({placement : 'bottom', title: "Open resume", container: '#cv'});
    $("#w42").tooltip({placement : 'bottom', title: "Contact by email", container: '#w42'});
    $("#bizcard").tooltip({placement : 'bottom', title: "Get business card", container: '#bizcard'});
    $("#linkedin").tooltip({placement : 'bottom', title: "Find me on LinkedIn", container: '#linkedin'});    
    $("#skype").tooltip({placement : 'bottom', title: "Contact by Skype", container: '#skype'}); 

});