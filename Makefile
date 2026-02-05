
default:
	echo "Specify a make target"
	false

# Works only for Dominique Unruh
deploy:
	npm run build
	rsync -a dist/ ~/r/qis-chair/people/unruh/tools/mail-link
	git -C ~/r/qis-chair add people/unruh/tools/mail-link
	git -C ~/r/qis-chair commit --only -m "Updated mail-link tool, git revision $$(git describe --always --dirty)" \
      people/unruh/tools/mail-link

# Works only for Dominique Unruh
deploy-push: deploy
	git -C ~/r/qis-chair push
