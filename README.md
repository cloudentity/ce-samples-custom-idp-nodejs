# Implementing a Custom Identity Provider with Node.js

In this specific article , we will create a Node.js application that acts like a custom identity provider to accept and processes authentication requests from Clouentity authorization server. This application is a reference application to showcase which all methods and callbacks custom identity providers should provide to work seamlessly with [Cloudentity Authorization Platform](https://authz.cloudentity.io/).

### Prerequisites

##### Cloudentity SaaS

[Sign up for a free Cloudentity SaaS tenant](https://authz.cloudentity.io/), in case you have not created a tenant yet.

##### Application development
- [Node.js](https://nodejs.org) - Recommended v16.x +
- [ExpressJS](https://expressjs.com) - Recommended 4.16.1 +

### Basic Concepts

It's highly common that organizations have home grown identity/authentication solutions that are not SAML/OIDC spec complaint. It could
be systems with direct database connections like SQL, LDAP etc or SSO based systems. Its quite common that these systems might store the representation of authenticated user in cookies to maintain user state. Organizations may want to still want to offer OIDC compliance without disrupting their existing authentication mechanisms or may want a transitionary path to migrate to a newer generation identity providers. Cloudentity provides the most fastest authorization server available in the market and also has a dedicated pattern to interact with such legacy identity providers to consume the user identity context. This sample application showcases how to interface between your existing identity provider and Cloudentity authorization server. [More details about the pattern can be found here](https://cloudentity.com/developers/howtos/identities/custom-idp/)

### Prepare Cloudentity Tenant

* Create a new workspace or choose an existing workspace
* Add a new custom identity provider and provider the URL where the identity provider is running. In this case, it will be where this app is running
* Make a note of the Client ID, Client secret, Issuer URL from the registered identity provider. We will use it later
* Configure the [mappings for the identity provider as described in the article](https://cloudentity.com/developers/howtos/identities/custom-idp/#configure-idp-settings)
* Map the [identity provide attributes to authentication context](https://cloudentity.com/developers/howtos/identities/custom-idp/#configure-authentication-context-attributes)
* Map [authentication context to claims](https://cloudentity.com/developers/howtos/auth-settings/managing_claims/)


Your workspace is now ready and the authorization server will now redirect the user to the identity provider for user authentication.  [Use the demo application within the platform itself to test the flow](https://cloudentity.com/developers/howtos/identities/custom-idp/#test)

### Configuring the Node.js application

To configure this application, open the .env file and substitute
`CLIENT_ID`, `CLIENT_SECRET`, `CLOUDENTITY_SYSTEM_ISSUER_URL` with values obtained during the custom identity provider registration.

update `TENANT_ID` to your Cloudentity SaaS tenant id
Set `AUTH_COOOKIE_NAME` to the cookie that represents authenticated session.

### Running locally

To configure this application, open the .env file and substitute
`CLIENT_ID`, `CLIENT_SECRET`, `CLOUDENTITY_SYSTEM_ISSUER_URL` with values obtained during the custom identity provider registration.

update `TENANT_ID` to your Cloudentity SaaS tenant id
Set `AUTH_COOOKIE_NAME` to the cookie that represents authenticated session.

To install all the npm packages, run `npm install`

To run the process locally, use `npm start`

### Running as docker 

Build the docker image - `docker build . -t sample-custom-idp`
Run the docker image - `docker run -it -p 4001:4001 sample-custom-idp /bin/s`

### Understanding the flow

To adhere to the custom idp integration pattern, there are couple of items that need mention.
* Handler to accept the traffic redirected for authentication from Cloudentity
* Once the traffic is accepted, verify if user is still authenticated or needs authentication
* If authentication is needed, redirect to the identity provider. If authentication is detected, fetch the information about the authenticated entity
* Now that we have this info, submit the authenticated information to Cloudentity
  * To perform this first fetch an accessToken from Cloudentity
  * Submit the payload about authenticated entity to Cloudentity
* Return the hanlde back to Cloudentity using the url returned in response to above submission.

All the above logic is in `index.js`. And below methods can be used as reference to deepen the understanding.
*  Handler to accept the traffic redirected for authentication from Cloudentity => codified within `router.get('/login'`
*  Handling authenticated vs non authenticated traffic => codified within `router.get('/login'`
* Fetching accessToken from Cloudentity => codified within `getAccessToken() method`
* Submit payload to Cloudentity => codified within `submitAcpAcceptCall() method`
* Return the handle back to Cloudentity => codified within `submitAcpAcceptCall() method`

### Conclusion
Cloudentity authorization platform makes it easy to integrate with any identity provider to be used as an authentication source.So without throwing away your existing authentication system, you can still make your platform much secure and modern by utilizing Cloudentity as authorization server.

### Relevant Links
 - [RFC 6749](https://datatracker.ietf.org/doc/html/rfc6749)
 - [Integrating with a non standard compliant Identity provider](https://cloudentity.com/developers/howtos/identities/custom-idp/)


