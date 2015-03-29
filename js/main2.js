$(function () {

    'use strict';  

    function post_articles(articles, template) {

        var article_pairs = pair(articles);

        for (var i=0; i < article_pairs.length; i++) {
            var $newdiv1 = $("<div class='row'/>");

            $newdiv1.append(Mustache.render(template, article_pairs[i][0]));
            if (article_pairs[i].length > 1) {
                $newdiv1.append(Mustache.render(template, article_pairs[i][1]));
            }

            $('#article_container').append($newdiv1);
        }
    }

    function pair(articles) {
        var result = [];    
        for (var i = 0; i < articles.length;) {
            if (i+1 < articles.length) {
                result.push([articles[i++], articles[i++]]);
            } else {
                result.push([articles[i++]]);
            }
        }
        return result;
    }

    $.getJSON('articles/1.json',  function(articles) {
            $.get('template.mst', function(template) {                
                post_articles(articles, template);
        });
    }); 

});