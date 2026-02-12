VERSION = $(shell jq -r .version manifest.json)
XPI = copy-message-link-$(VERSION).xpi
SOURCES = copy.js icon.svg manifest.json options.html options.js

xpi: $(XPI)

$(XPI) : $(SOURCES) Makefile
	zip -r $@ $(SOURCES)

clean :
	rm -f copy-message-link-*.xpi

# For Linux. Use with care!
install-xpi: $(XPI)
	# Guessing active profile directory
	PROFILE="$$(ls -1t ~/.thunderbird/ | head -1)" && cp -v $(XPI) ~/.thunderbird/"$$PROFILE/extensions/mail-link@unruh.de.xpi"
