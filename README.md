# category
This microservice was generated using the Albatross Generator for the **category** project.

Navigate to the api-docs page to view the Swagger page for this service!

# How to launch
Running this microservice on your local environment is easy.  You will need to install npm first, which you can download from here:  https://www.npmjs.com/get-npm.

Once you have npm installed:

1. Open a terminal at the project location.
2. Enter "npm install" - this will install all project dependencies (initially done during generation).
3. Enter "npm start".
4. Navigate to localhost:8080/healthcheck - you'll see the "Success" response.

# How to configure
Now that you are able to launch the microservice, you'll probably want to configure it for your project.

## Plug In Your Routes
Routes are located under app/routes/`<file name>.api.ts`

Group your related routes in a routes file inside the app/routes folder.  Albatross will insert a default.api.ts route file upon generation of the microservice with standard routes already included and ready to test.  Feel free to modify this file as necessary for your project.

## Plug In Your Services
Services are located under apps/services/`<file name>.service.ts`. 

Service files are used to encapsulate the "business" functionality of your microservice through their exported functions.  Any functions not called directly by any route should be declared private and not exported from within the service file.

## Plug In Appdynamics
Each microservice comes included with the appdynamics package.  Please review the information below if you wish to utilize AppDynamics for your microservice.

AppDynamics is enabled within the apps/server.ts file, and uses the configuration values stored in the config/app-dynamics.config.ts configuration file.

Several configuration properties must be set, and most of these should have corresponding environment variables set in the vault. There are a few properties which must be customized for each micro-service: tierName, nodeName, and reuseNodePrefix should all be set equal to a string that uniquely identifies your project such as 'hello-world-ms'. A list of the properties, some typical vaules, and descriptions is below.

appdynamics.profile({
    debug: true
    controllerHostName: 'server.domain.com' // Visit this URL to view metrics
    controllerPort: 443
    controllerSslEnabled: true
    accountName: 'some-string' // Get this from appdynamics vendor
    accountAccessKey: 'some-string' // Get this from appdynamics vendor
    applicationName: 'application-DEV' // Identifies an environment or set of services working together
    tierName: 'service-name' // Identifies the type of service. Probably use repository name
    nodeName: 'service-name' // Identifies an instance/container/pod of the service. Can be same as tierName
    reuseNode: true
    reuseNodePrefix: 'service-name' //Can be same as nodeName and tierName
    libagent: true
  });

## Healthcheck
Each microservice will have a `/healthcheck` endpoint

## The Vault For Your Variables
Description coming soon!

# Have something to offer?
This microservice base is open to accepting pull requests. If you come across something that can improve the architecture or packages used, plesae create a separate branch from 'development', make your updates, and create a pull request against 'development'. Thanks!


