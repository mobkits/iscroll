dev:
	@open http://localhost:8080/example/index.html
	@gulp

standalone:
	@component build -c
	@cp build/build.js iscroll.js

doc:
	@rm -rf .gh-pages
	@gulp example
	@mkdir .gh-pages
	@cp -r example/* .gh-pages
	@ghp-import .gh-pages -n -p
	@rm -rf .gh-pages

.PHONY: clean doc
