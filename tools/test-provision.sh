# Send a request to add/delete a device to Azure IoT Hub.
#
# Params:
#    * method -- POST (to create), or DELETE
#
#    $ test-provision.sh <POST|DELETE>
#
# Use your values for variables of the form '<your-*>'.

BALENA_DEVICE_UUID=<your-device-UUID>
BALENA_SERVICE_NAME=<your=service-name-or-blank>
# URL for local server from run-local-server.sh
PROVISION_URL="http://localhost:7071/api/provision"
# URL for Azure function app
#PROVISION_URL=<your-azure-function-url>

curl $PROVISION_URL -H "Content-Type:application/json" \
   -d '{ "balena_service": "'$BALENA_SERVICE_NAME'", "method": "'$1'", "uuid": "'$BALENA_DEVICE_UUID'" }' -v
