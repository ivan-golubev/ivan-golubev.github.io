$(function () {

    'use strict';  

    var view = {
        img_src:    "img/cat.png",
        title:      "Cats Everywhere",
        name_date:  "24 July 2013, Alexander Rechsteiner",
        body_text:  "Bacon ipsum dolor sit amet esse duis pastrami anim, pancetta fatback capicola officia tenderloin. Meatloaf culpa ut, bacon sed sausage jerky cillum est ham ad laboris ham hock dolore. Venison ut enim, aliqua elit frankfurter et incididunt consequat culpa nostru aliqua elit pancetta. "
    }; 

    $.get('template.mst', function(template) {
        var rendered = Mustache.render(template, view);
        $('#art-1').append(rendered);
    });

});