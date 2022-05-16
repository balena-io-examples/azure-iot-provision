# Run a local Azure Functions server to provision to Azure IoT.
#
#    $ run-local-server.sh
#
#    Use your values for variables of the form '<your-*>'.

export BALENA_API_KEY=<your-balena-api-key>
export CONNECTION_STRING="<your-iot-hub-connection-string>"

func start
