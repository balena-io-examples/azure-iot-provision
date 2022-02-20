# Run a local Azure Functions server to provision to Azure IoT.
#
#    $ run-local-server.sh
#
#    Use your values for variables of the form '<your-*>'.

export RESIN_EMAIL=<your-balena-email-name>
export RESIN_PASSWORD=<your-password-for-balena-email>
export CONNECTION_STRING="<your-iot-hub-connection-string>"

func start
