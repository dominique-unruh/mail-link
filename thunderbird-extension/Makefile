VERSION = $(shell jq -r .version package.json)
XPI = copy-message-link-$(VERSION).xpi
SOURCES = $(sort $(wildcard dist/*) dist/manifest.json)

xpi: $(XPI)

$(SOURCES): $(wildcard src/*)
	rm -rf dist/
	npm run build

$(XPI) : $(SOURCES) Makefile
	rm -f $(XPI)
	cd dist && zip -r ../$@ .

clean :
	rm -f copy-message-link-*.xpi dist/

# For Linux. Use with care!
install-xpi: $(XPI)
	# Guessing active profile directory
	PROFILE="$$(ls -1t ~/.thunderbird/ | head -1)" && cp -v $(XPI) ~/.thunderbird/"$$PROFILE/extensions/mail-link@unruh.de.xpi"
