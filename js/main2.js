$(function () {

    'use strict';  

    $.getJSON('articles/1.json',  function(article) {
            $.get('template.mst', function(template) {
                var rendered = Mustache.render(template, article);
                $('#art-1').append(rendered);
        });
    }); 



});