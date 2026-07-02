.PHONY: default install build test typecheck clean

default:
	echo "Specify a make target: install, build, test, typecheck, clean"
	false

# Install dependencies
install:
	npm install

# Build dist/bookmarklet.min.js and dist/install.html
build:
	npm run build

# Run the unit tests
test:
	npm test

# Type-check without emitting
typecheck:
	npm run typecheck

clean:
	rm -rf dist
