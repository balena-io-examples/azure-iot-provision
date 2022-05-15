# Send a request to add/delete a device to Azure IoT Hub.
#
# Params:
#    * method -- POST (to create), or DELETE
#
#    $ test-provision.sh <POST|DELETE>
#
# Use your values for variables of the form '<your-*>'.

BALENA_DEVICE_UUID=<your-device-UUID>
# Name of balena service that will provision a device
BALENA_SERVICE_NAME=<your-service-name-or-blank>
# URL for local server from run-local-server.sh
PROVISION_URL="http://localhost:7071/api/provision"

curl -X $1 $PROVISION_URL -H "Content-Type:application/json" \
   -d '{ "uuid": "'$BALENA_DEVICE_UUID'", "balena_service": "'$BALENA_SERVICE_NAME'" }' -v
