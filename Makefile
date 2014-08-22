# Basic Makefile

UUID = cpufreq@nodefourtytwo.net
BASE_MODULES = extension.js metadata.json README.md
INSTALLBASE = ~/.local/share/gnome-shell/extensions
INSTALLNAME = cpufreq@nodefourtytwo.net

# The command line passed variable VERSION is used to set the version string 
# in the metadata and in the generated zip-file. If no VERSION is passed, the
# current commit SHA1 is used as version number in the metadata while the
# generated zip file has no string attached.
ifdef VERSION
	VSTRING = _v$(VERSION)
else
	VERSION = $(shell git rev-parse HEAD)
	VSTRING =
endif

all: extension

clean:

extension:

install: install-local

install-local: _build
	rm -rf $(INSTALLBASE)/$(INSTALLNAME)
	mkdir -p $(INSTALLBASE)/$(INSTALLNAME)
	cp -r ./_build/* $(INSTALLBASE)/$(INSTALLNAME)/
	-rm -fR _build
	echo done

zip-file: _build
	cd _build ; \
	zip -qr "$(UUID)$(VSTRING).zip" .
	mv _build/$(UUID)$(VSTRING).zip ./
	-rm -fR _build

_build: all
	-rm -fR ./_build
	mkdir -p _build
	cp $(BASE_MODULES) _build
	sed -i 's/"version": 0/"version": "$(VERSION)"/'  _build/metadata.json;
