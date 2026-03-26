default:
	echo "Specify a make target"
	false

webapp-deploy-push:
	make -C webapp deploy-push

thunderbird-install-xpi:
	make -C thunderbird-extension install-xpi