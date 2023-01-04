A simple example of Memberful's Server-Side App (SSA) OAuth flow written in NodeJS and Express

Note: If you're building a mobile or Single-Page application, you should use the PKCE flow instead.

For more information, check out [our documentation](https://memberful.com/help/custom-development-and-api/sign-in-for-apps-via-oauth/)

## Installation

Run the following command to install dependencies:

```bash
npm install
```

## Usage

To run locally, run the following command to start the server:

```bash
npm start
```

You can also upload this to a publicly accessible server and run it there.

Open the following URL to verify that the server is running properly — You should see a "lobby" page with a link to begin the OAuth flow.

```bash
http://localhost:3000/
```

(if you're not running this locally, replace localhost:3000 with your server's public URL)

Now that we know the server is running properly, let's create a Custom Application in Memberful.

Go to Settings → Custom applications and create a new application. Check the "include OAuth tokens with this application" checkbox.

This example is showing the SSA flow, so pick either "Server-side Application" as the application type.

For your OAuth Redirect URL, enter the following:

```bash
http://localhost:3000/callback
```

(if you're not running this locally, replace localhost:3000 with your server's public URL)

Copy your custom app's "OAuth Identifier" and paste it into src/index.js as the value of the **clientId** variable (you'll see a comment about this in the code).

Copy your custom app's "OAuth Secret" and paste it into src/index.js as the value of the **clientSecret** variable (you'll see a comment about this in the code).

Now we're ready to begin the OAuth flow by opening the following URL.

```bash
http://localhost:3000/begin-oauth-flow
```

You can change the path for this route and for the callback near the top of the src/index.js file. (If you change the callback path, you'll need to create a new Custom Application in Memberful and replace the OAuth Identifier with the new one.)

If everything works, you'll be asked to sign in (you'll need a member account to sign into), and then you'll end up at the /callback route displaying the results of our requests (access token, refresh token, fetched member data, and refreshed access token). It'll look something like this:

```javascript
Results from our access token request:
{
  "access_token": "F2Ns8Sbg4z6ZejTadwtr2ash",
  "expires_in": 899,
  "refresh_token": "wSu5hEqH9d8KHXsPHSrN6DdV",
  "token_type": "bearer"
}

Results from our member data request:
{
  "data": {
    "currentMember": {
      "id": "2406643",
      "email": "maren.member@gmail.com",
      "fullName": "Maren Member",
      "subscriptions": [
        {
          "active": false,
          "expiresAt": 1667066915,
          "plan": {
            "id": "78645",
            "name": "Premium Monthly"
          }
        },
        {
          "active": true,
          "expiresAt": null,
          "plan": {
            "id": "65673",
            "name": "One time success"
          }
        },
        {
          "active": false,
          "expiresAt": 1655999542,
          "plan": {
            "id": "62764",
            "name": "Premium"
          }
        }
      ]
    }
  }
}

Results from our refresh token request:
{
  "access_token": "Ei7yKo1dwJiiunABzroNEXzw",
  "expires_in": 899,
  "refresh_token": "wSu5hEqH9d8KHXsPHSrN6DdV",
  "token_type": "bearer"
}
```

Visit [this article](https://memberful.com/help/custom-development-and-api/sign-in-for-apps-via-oauth/#requesting-member-data) to learn more about fetching the member's data from Memberful's API with your access token.
