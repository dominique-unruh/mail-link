
default:
	echo "Specify a make target"
	false

# Run the webapp test suite
tests:
	npm test

# Works only for Dominique Unruh
deploy:
	# The bookmarklet template is inlined into bookmarklet.html at build time.
	make -C ../bookmarklet build
	npm run build
	rsync -a dist/ ~/r/qis-web/people/unruh/tools/mail-link
	git -C ~/r/qis-web add people/unruh/tools/mail-link
	git -C ~/r/qis-web commit --only -m "Updated mail-link tool, git revision $$(git describe --always --dirty)" \
      people/unruh/tools/mail-link

# Works only for Dominique Unruh
deploy-push: deploy
	git -C ~/r/qis-web push
