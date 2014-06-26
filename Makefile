
build: components index.js iscroll.css
	@component build --dev

components: component.json
	@component install --dev

clean:
	rm -fr build components

watch:
	@component build --dev -w

standalone:
	@component build -c
	@cp build/build.js iscroll.js

doc:
	@component build --dev
	@rm -fr .gh-pages
	@mkdir .gh-pages
	@mv build .gh-pages/
	@cp example.html .gh-pages/index.html
	@ghp-import .gh-pages -n -p
	@rm -fr .gh-pages

.PHONY: clean doc
