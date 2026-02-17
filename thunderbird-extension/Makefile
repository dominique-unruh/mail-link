VERSION = $(shell jq -r .version package.json)
XPI = copy-message-link-$(VERSION).xpi
SOURCES = $(wildcard dist/*) dist/options.js

xpi: $(XPI)

$(SOURCES):
	npm run build

$(XPI) : $(SOURCES) Makefile
	cd dist && zip -r ../$@ .

clean :
	rm -f copy-message-link-*.xpi dist/

# For Linux. Use with care!
install-xpi: $(XPI)
	# Guessing active profile directory
	PROFILE="$$(ls -1t ~/.thunderbird/ | head -1)" && cp -v $(XPI) ~/.thunderbird/"$$PROFILE/extensions/mail-link@unruh.de.xpi"
