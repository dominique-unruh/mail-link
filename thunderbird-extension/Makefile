VERSION = $(shell jq -r .version manifest.json)
XPI = copy-message-link-$(VERSION).xpi
SOURCES = copy.js icon.svg manifest.json options.html options.js

xpi: $(XPI)

$(XPI) : $(SOURCES) Makefile
	zip -r $@ $(SOURCES)

clean :
	rm -f copy-message-link-*.xpi
