function setupTheme() {
	const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
	const enforceDarkTheme = true; // just use dark theme, it is better
	if (prefersDarkScheme.matches || enforceDarkTheme) {
	  document.body.classList.add("dark-theme");
	} else {
	  document.body.classList.remove("dark-theme");
	}
}

window.addEventListener('load', setupTheme, false);
