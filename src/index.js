/****************************************************************
 ** Memberful OAuth2 SSA Example - Node.js + Express
 **
 ** This example shows how to use the Memberful OAuth2 Server-side
 ** app flow to authenticate a user and retrieve their profile information.
 **
 ** This is the flow you would use for a server-side application.
 ** If you're building a mobile or Single-Page application, you should
 ** use the PKCE flow instead.
 **
 ** For more information, check out our documentation:
 ** https://memberful.com/help/custom-development-and-api/sign-in-for-apps-via-oauth/
 ****************************************************************/

import express from 'express';
import axios from 'axios';

//****************************************************************
//*** Configuration
//****************************************************************

const defaultPort = 3000;

// Choose the URL you want to use for the sign-in route
const beginOAuthFlowURL = '/login';

// Choose the URL you want to use for the callback route.
// This must match the callback URL you set as the Redirect URL
// for your Custom OAuth app in the Memberful dashboard
const callbackURL = '/callback';

// Your Memberful account subdomain (e.g. https://example.memberful.com).
const memberfulURL = 'INSERT_YOUR_MEMBERFUL_URL_HERE';

// Your custom app's "OAuth Identifier", found in the Memberful dashboard.
const clientId = 'INSERT_YOUR_OAUTH_IDENTIFIER_HERE';

// Your custom app's "OAuth Secret", found in the Memberful dashboard.
const clientSecret = 'INSERT_YOUR_OAUTH_SECRET_HERE';

//****************************************************************
//*** Helper function for generating the codes we'll need
//****************************************************************

export const generateRandomString = (length) => {
  let text = '';
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
};

//****************************************************************
//*** Declare necessary variables
//****************************************************************

//We'll be generating our state string later on, but we'll need to keep
//track of it throughout the flow, so we'll declare it here.
let state = '';

//****************************************************************
//*** Begin Express app
//****************************************************************

const app = express();

// Lobby: This route isn't part of the OAuth flow, it's just for
// our convenience during development.
app.get('/', (req, res) => {
  res.send(`
  <html><head></head><body>
    <h1>Memberful OAuth SSA Example - NodeJS + Express (No auth library)</h1>
    <p><a href="${beginOAuthFlowURL}">Begin OAuth Flow</a></p>
  </body></html>
  `);
});

// > Step 1) Create a route to begin the OAuth flow

// We must first generate the necessary codes and
// open the browser to begin the OAuth flow. Whenever a user tries
// to access a route that requires authentication, we should redirect
// to this route, so you can name this route /login or something
// similar.
app.get(beginOAuthFlowURL, (req, res) => {
  // > Step 2) Generate the codes we'll need

  // Let's generate our state, which is just a random string
  state = generateRandomString(16);
  // Remember to store the state for use in later steps
  // For this example, we're just storing it in a global variable

  // Response type is always 'code'
  const responseType = 'code';

  // > Step 3) Request Auth code: This is where we start the OAuth flow
  // Your application must open this Memberful URL in a browser
  // to allow the member to sign in:
  // https://YOURSITE.memberful.com/oauth
  res.redirect(
    `${memberfulURL}/oauth/?response_type=${responseType}&client_id=${clientId}&state=${state}`
  );
});

// > Step 4) User signs in via Memberful. We use passwordless sign-in by default,
// so they'll receive an email with a link to sign in. Once they click that link,
// they'll be redirected to the callback URL you set in the Memberful dashboard.
// Note: The link they receive in their email will include a token. This token
// is *not* the auth code we're looking for. It's not part of this flow.

// > Step 5) Callback Route: This is the route you set as the Redirect URL for your
// Custom OAuth app in the Memberful dashboard. Memberful will redirect the user to
// this URL after // they've signed in via Memberful, attaching the auth code and
// state to the URL.
// Example: https://YOURAPP.com/oauth_callback?code=[CODE]&state=[STATE]
app.get(callbackURL, async (req, res) => {
  // We'll grab those two parameters from the URL
  const { code, state: returnedState } = req.query;

  // > Step 6) Verify state - this is a security measure
  if (state !== returnedState) {
    res.send("State doesn't match");
  } else {
    try {
      // > Step 7) Access token request
      // Now that we have the auth code, exchange it for an access token
      // Make a POST request to this URL:
      // https://YOURSITE.memberful.com/oauth/token
      const accessTokenResponse = await axios.post(
        `${memberfulURL}/oauth/token`,
        {
          // The grant type is always 'authorization_code'
          grant_type: 'authorization_code',
          code,
          client_id: clientId,
          client_secret: clientSecret,
        }
      );

      // We now have an access token!
      // Example response:
      // accessTokenResponse.data === {"access_token":"d4b39Hjxo2m1aPiiLwuZyh6R","expires_in":899,"refresh_token":"J5P7AX7b6L9LTiWEbShzheNV","token_type":"bearer"}

      // Let's extract the access and refresh tokens for the next steps
      const { access_token, refresh_token } = accessTokenResponse.data;

      // > Step 8) Query Member Data
      // Now that we have an access token, we can use it to query the member's data

      // First, let's build our GraphQL query, which will tell Memberful which fields we want.
      // To learn more about our API and which fields are available, check out these two articles:
      // https://memberful.com/help/custom-development-and-api/sign-in-for-apps-via-oauth/#requesting-member-data
      // https://memberful.com/help/custom-development-and-api/memberful-api/#using-the-graphql-api-explorer
      const memberQuery = `
        {
          currentMember {
            id
            email
            fullName
            subscriptions {
              active
              expiresAt
              plan {
                id
                name
              }
            }
          }
        }
        `;

      // Make a GET request to this URL:
      // https://YOURSITE.memberful.com/api/graphql/member?query=GRAPHQL_QUERY
      const memberDataResponse = await axios.get(
        `${memberfulURL}/api/graphql/member?query=${memberQuery}`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      console.log(memberDataResponse.data);

      // We now have the member's data!
      //
      // Example response:
      // memberDataResponse.data === {
      //   "currentMember": {
      //       "id": "2406643",
      //       "email": "maren.member@gmail.com",
      //       "fullName": "Maren",
      //       "subscriptions": [
      //           {
      //               "plan": {
      //                   "id": "65673",
      //                   "name": "One time success"
      //               },
      //               "active": true,
      //               "expiresAt": null
      //           }
      //       ]
      //   }
      //}

      // Feel free to use this data inside your app.
      // Alternatively, you can run more queries to fetch more data via our API:
      // https://memberful.com/help/custom-development-and-api/memberful-api/

      // > Step 9) Refresh token request
      // Access tokens are valid for 15 minutes.
      // You can use the refresh token (provided with each access token)
      // to get a new access token. Refresh tokens are valid for one year.
      // To obtain a new access token, send a POST request to:
      // https://YOURSITE.memberful.com/oauth/token

      const refreshTokenResponse = await axios.post(
        `${memberfulURL}/oauth/token`,
        {
          // The grant type is always 'refresh_token'
          grant_type: 'refresh_token',
          refresh_token,
          client_id: clientId,
          client_secret: clientSecret,
        }
      );

      console.log(
        "We've refreshed the token! New access token: ",
        refreshTokenResponse.data
      );

      // We now have a new access token!
      // Example response:
      // refreshTokenResponse.data === {
      //     "access_token": "wMGRkW7ahw1vFNctr1uCzLQd",
      //     "expires_in": 899,
      //     "refresh_token": "AgKtiGrPiBAKtsPGx4kKduuk",
      //     "token_type": "bearer"
      // }

      // That's all! For more information on this process, check out our docs:
      // https://memberful.com/help/custom-development-and-api/sign-in-for-apps-via-oauth/

      // Let's output a summary of the results, just for our own reference
      res.send(`
      <html><head></head><body>
        <h2>Results from our access token request:</h2>
        <pre>${JSON.stringify(accessTokenResponse.data, null, 2)}</pre>
        <h2>Results from our member data request:</h2>
        <pre>${JSON.stringify(memberDataResponse.data, null, 2)}</pre>
        <h2>Results from our refresh token request:</h2>
        <pre>${JSON.stringify(refreshTokenResponse.data, null, 2)}</pre>
      </body></html>
      `);
    } catch (error) {
      console.log(error);
      res.send(error.data);
    }
  }
});

// Start the Express server
const PORT = process.env.PORT || defaultPort;
app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
