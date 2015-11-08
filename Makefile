dev:
	@open http://localhost:3000/example/index.html
	@gulp

standalone:
	@component build -c
	@cp build/build.js iscroll.js

doc:
	@ghp-import example -n -p

.PHONY: clean doc
