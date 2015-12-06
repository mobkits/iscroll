dev:
	@open http://localhost:3000/example/index.html
	@gulp

standalone:
	@component build -c
	@cp build/build.js iscroll.js

test:
	@open http://localhost:8080/bundle
	@webpack-dev-server 'mocha!./test/test.js' --inline --hot --debug

test-karma:
	@node_modules/.bin/karma start --single-run

test-coveralls:
	@echo TRAVIS_JOB_ID $(TRAVIS_JOB_ID)
	@node_modules/.bin/karma start --single-run && \
		cat ./coverage/lcov/lcov.info | ./node_modules/coveralls/bin/coveralls.js

doc:
	@ghp-import example -n -p

.PHONY: clean doc test
