dev:
	@open http://localhost:8080/example/index.html
	@gulp

standalone:
	@component build -c
	@cp build/build.js iscroll.js

doc:
	@ghp-import example -n -p

.PHONY: clean doc
