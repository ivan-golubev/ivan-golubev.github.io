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

function setupCommentLoader() {
	let commentSectionAdded = false;
	let observer;

	// when user reaches the end of the page - load the comments
	// this is needed for iOS
	function observeBottomMarker() {
		function callback (entries, observer) {
			const entry = entries[0];
			if (entry.isIntersecting && !commentSectionAdded) {
				commentSectionAdded = true;
				appendCommentsDiv();
				observer.unobserve(entry.target);
			}
		}
		observer = new IntersectionObserver(callback, {threshold: 1});
		observer.observe(document.getElementById('bottom-marker'));
	}
	return observeBottomMarker;
}

window.addEventListener('load', setupCommentLoader, false);
