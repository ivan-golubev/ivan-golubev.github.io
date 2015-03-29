
var page_number = 1, page_size = 4;

$(function () {

    'use strict';  

    function post_articles(articles, template) {
        var article_pairs = pair(articles);

        for (var i = 0; i < article_pairs.length; i++) {
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

    function load_tags(articles) {        
        var tags = new buckets.Set();
        for (var i = 0; i < articles.length; i++) {
            buckets.arrays.forEach(articles[i].tags, function(tag){
                tags.add(tag);
            });
        }
        $.get('tag_template.mst', function(tag_template) {                
                tags.forEach(function(tag) {
                    $('#tags').append(Mustache.render(tag_template, {tag_name: tag}));
                });               
        });    

    }

    $.getJSON('articles/1.json',  function(articles) {
            $.get('template.mst', function(template) {                
                post_articles(articles, template);
                load_tags(articles);
        });
    }); 

});