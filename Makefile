dev:
	@open http://localhost:3000/example/index.html
	@gulp

standalone:
	@component build -c
	@cp build/build.js iscroll.js

test:
	@open http://localhost:8080/bundle
	@webpack-dev-server 'mocha!./test/test.js' --inline --hot

test-karma:
	@node_modules/.bin/karma start --single-run

doc:
	@ghp-import example -n -p

.PHONY: clean doc test
