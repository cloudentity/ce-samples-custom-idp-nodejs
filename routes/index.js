const express = require('express');
const axios = require('axios');
const qs = require('qs');
const https = require('https');
const res = require('express/lib/response');

const router = express.Router();
require('dotenv').config();

const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
});

const tenant_id = process.env.TENANT_ID;
const issuer_url = process.env.CLOUDENTITY_SYSTEM_ISSUER_URL;
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const auth_cookie_name = process.env.AUTH_COOKIE_NAME;
const auth_token = Buffer.from(`${client_id}:${client_secret}`, 'utf-8').toString('base64');
const origin = (new URL(issuer_url)).origin;

router.get('/health', function (req, res, next) {
  res.render('health');
});

// This is to handle the redirects from Cloudentity authorization platform. This URL is configurable
// and depends on the URL configured for redirect within Cloudentity
router.get('/login', function (req, res, next) {
  
  sess = req.session;
  // let's add the query params to the session for later retrieval

  // initialize session state
  sess.loginId = req.query.login_id;
  sess.loginState = req.query.login_state;

  // Here check if there is a cookie, if not redirect to login page
  // Let's check if the user is in authenticated state represented by the presence of 
  // a cookie normally used in sso based implementations.

  console.log("auth_cookie_name", auth_cookie_name);

  authSessIdentifier = req.cookies[auth_cookie_name];

  if(authSessIdentifier != null) {
    // let's get details about the auth session and process
    console.log("authSessIdentifier", authSessIdentifier);
    fetchUserDetailsAndProcess(req, res, authSessIdentifier)
  } else {
   // login_url = 'login?login_id='+ req.query.login_id + '&login_state=' + req.query.login_state;
   console.log("auth session not available, redirecting to identity provider login")
    // here it redirects this app's own login page, but in reality it should be the actual identity
    // provider itself, make sure to return the login_id and login_state to the redirect here to
    // identity provider, so that they can return back to above url once user is authenticated..
    res.render('login');
  }

});

//route to handle internal dummy login submission
// ideally this would not be required if redirected to a proper idp in line #57
router.post('/submitlogin', async function (req, res, next) {

  // Here you can plugin in any logic, for now, we assume the user is
  // good and create a login session for the user and set some cookies
  // to represent the authenticated login session

  var randomNumber=Math.random().toString();
  var login_url = 'login?login_id='+ req.session.loginId + '&login_state=' + req.session.loginState;
  res.cookie('jsessionid',randomNumber, { maxAge: 900000, httpOnly: true });

  // this method sets a cookie that represented authenticated user session and returns to initial url 
  res.redirect(login_url);

});

async function fetchUserDetailsAndProcess(req, res, userIdentifier) {
  // ACP calls with the result
  const accept_login = await submitAcpAcceptCall(req, res, userIdentifier);
}

// This method returns dummy user details to be populated in an authentication context
router.post('/getuser', function (req, res, next) {

  let useridentifier = req.body.identifier;
  var auth_date = new Date();

  var response =  {
      'identifier': 'user' + useridentifier,
      'subscriptionId': '765' + useridentifier,
      'name': 'emily' + useridentifier,
      'username': 'user' + useridentifier,
      'email': 'emily@wonderland.com' + useridentifier,
      'auth_time': auth_date.toString,
      'customer_id': 'C001' + useridentifier
    }
  
  res.json(response);

});


/*
Retrieves an access token from the system application that was created automatically when
the custom consent page was selected in ACP. The access token is required to make a scope grant request.
*/
const getAccessToken = async (res) => {  
  let CLOUDENTITY_TOKEN_FETCH_API = cloudentityAccessTokenURL();

  try {
    const data = qs.stringify({ grant_type: 'client_credentials', scope: 'manage_logins'});

    const options = {
      method: 'POST',
      url: CLOUDENTITY_TOKEN_FETCH_API,
      rejectUnauthorized: false,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + auth_token
      },
      data: data
    };

    console.log(options);

    const response = await axiosInstance(options);

    console.log("response from access token call", response);
    return response.data.access_token;
  } catch (error) {
    console.log(error);
    res.render('error', { msg: 'error getting access token: ' + error });
  }
}

// https://developer.cloudentity.com/api/oauth2/#operation/token
function cloudentityAccessTokenURL() {
  return origin + '/' + tenant_id + '/system/oauth2/token';
}

const submitAcpAcceptCall = async (req, res, authSessionIdentifier) => {

  const data = {identifier: authSessionIdentifier};
  // This ideally must be an external API call that returns the user details, currently a get user endpoint is exposed that just
  // returns dummy data based on the provided authSessionIdentifier

  const getUserOpt = {
    method: 'POST',
    url: "http://localhost:4001/getuser",
    rejectUnauthorized: false,
    headers: {
      'Content-Type': 'application/json'
    },
    data: data
  };

  //wait to fetch user data
  const result = await axios(getUserOpt);
  console.log('get user data :%s', result);

  // Get AccessToken to call ACP login accept API
   const access_token_result = await getAccessToken(res);
   const CLOUDENTITY_LOGIN_ACCEPT_API = getCloudentityAcceptUrl(req);

  // construct the payload for ACP accept API
  const payload = {
    'amr': [ 'pwd', 'otp'],
    'auth_time': result.data.auth_time,
    'subject': result.data.identifier,
    'id': result.data.identifier,
    'login_id': req.session.loginId,
    'login_state': req.session.loginState,
    "authentication_context": {
      'customIdp_username': result.data.username,
      'customIdp_email': result.data.email,
      'customIdp_jsessionid': authSessionIdentifier,
      'customIdp_customerId': result.data.customer_id
    },
   };

  const options = {
    url: CLOUDENTITY_LOGIN_ACCEPT_API,
    method: "POST",
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Bearer ' + access_token_result,
    },
    data: payload
  }

  try {
    let acceptRes = await axiosInstance(options);
    console.log("Login accept response:", acceptRes);
    // redirect to Cloudentity URL to continue the authorization flow
    res.redirect(acceptRes.data.redirect_to);
  } catch (error) {
    console.log(error);
    res.render('error', { msg: 'failed to submit login info to Cloudentity: ' + error });
  }
}

function getCloudentityAcceptUrl(req) {
  return origin + '/api/system/' + tenant_id + '/logins/' + req.session.loginId + '/accept';
}

module.exports = router;
