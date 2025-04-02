function appendCommentsDiv() {
	newScript = document.createElement('script');
	newScript.setAttribute('src', 'https://utteranc.es/client.js');
	newScript.setAttribute('repo', 'ivan-golubev/blog-comments');
	newScript.setAttribute('issue-term', 'pathname');
	newScript.setAttribute('theme', 'github-light');
	newScript.setAttribute('crossorigin', 'anonymous');
	newScript.setAttribute('async', '');
	document.body.appendChild(newScript);
}

window.onload = function() {
	appendCommentsDiv();
}