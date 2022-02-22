# Create storage account and Azure Functions app
#
#    $ create-func.sh
#
# Use your values for variables of the form '<your-*>'.

# environment variables required to run the function; see project README.md
resin_email="<your-balena-email-name>"
resin_password="<your-password-for-balena-email>"
connection_string="<your-iot-hub-connection-string>"

# for function app
app_name="<your-app-name>"
# must be 3-24 characters, lower case or numeric
storage_name="<your-storage-name>"
resource_group="<your-resource-group>"
# use the code name, like "eastus" rather than display name like "East US"
region="<your-region>"

echo "Creating storage account..."
az storage account create --name "$storage_name" --location "$region" \
   --resource-group "$resource_group" --sku Standard_LRS

echo "Creating function app..."
az functionapp create --resource-group "$resource_group" --name "$app_name" \
   --storage-account "$storage_name" --consumption-plan-location "$region" \
   --runtime node --runtime-version 14 --functions-version 4 --os-type Linux

echo "Adding function app variables..."
# CLI reference says the '--settings' parameter should accept a space-separated list of
# key=value pairs, but this does not work as of 2022-02.
# https://docs.microsoft.com/en-us/cli/azure/functionapp/config/appsettings?view=azure-cli-latest
az functionapp config appsettings set --name "$app_name" --resource-group "$resource_group" \
   --settings "RESIN_EMAIL=$resin_email"
az functionapp config appsettings set --name "$app_name" --resource-group "$resource_group" \
   --settings "RESIN_PASSWORD=$resin_password"
az functionapp config appsettings set --name "$app_name" --resource-group "$resource_group" \
   --settings "CONNECTION_STRING=$connection_string"
