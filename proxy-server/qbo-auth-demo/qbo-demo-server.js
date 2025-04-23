import 'dotenv/config';
import express from 'express';
import OAuthClient from 'intuit-oauth';
import bodyParser from 'body-parser';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './qbo-openapi.json' with { type: 'json' };

const app = express();
app.use(bodyParser.json());

let oauth2_token_json = null;

const oauthClient = new OAuthClient({
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  environment: process.env.ENVIRONMENT,
  redirectUri: process.env.REDIRECT_URI,
  logging: false,
});

/**
 * OpenAPI UI (Swagger UI) configuration
 * @type {Object}
 */
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

/**
 * Get the Authorize URI endpoint
 * @see Intuit_Dev_Docs: https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization/oauth-2.0
 * @see Intuit_Dev_Playground: https://developer.intuit.com/app/developer/playground
 * @route GET /authUri
 * @returns {Object} JSON response containing the authorization URI
 */
app.get('/authUri', (req, res) => {
  const authUri = oauthClient.authorizeUri({
    scope: [OAuthClient.scopes.Accounting, OAuthClient.scopes.OpenId, OAuthClient.scopes.Profile, OAuthClient.scopes.Email],
    state: 'intuit-test',
  });
  res.json({ authUri });
});

/**
 * OAuth Callback endpoint
 * @route GET /callback
 * @returns {Object} JSON response containing success status and token
 */
app.get('/callback', (req, res) => {
  oauthClient
    .createToken(req.url)
    .then((authResponse) => {
      oauth2_token_json = authResponse.json;
      res.json({ success: true, token: oauth2_token_json });
    })
    .catch((e) => {
      res.status(400).json({ error: e.message });
    });
});

/**
 * Retrieve Token endpoint
 * @route GET /retrieveToken
 * @returns {Object} JSON response containing the stored token
 */
app.get('/retrieveToken', (req, res) => {
  if (!oauth2_token_json) return res.status(404).json({ error: 'No token found.' });
  res.json(oauth2_token_json);
});

/**
 * Refresh Access Token endpoint
 * @route GET /refreshAccessToken
 * @returns {Object} JSON response containing the refreshed token
 */
app.get('/refreshAccessToken', (req, res) => {
  oauthClient
    .refresh()
    .then((authResponse) => {
      oauth2_token_json = authResponse.json;
      res.json(oauth2_token_json);
    })
    .catch((e) => {
      res.status(400).json({ error: e.message });
    });
});

/**
 * Get Company Info endpoint
 * @route GET /getCompanyInfo
 * @returns {Object} JSON response containing company information
 */
app.get('/getCompanyInfo', (req, res) => {
  if (!oauth2_token_json || !oauthClient.getToken().realmId) {
    return res.status(400).json({ error: 'No token or realmId found.' });
  }
  const companyID = oauthClient.getToken().realmId;
  const url =
    process.env.ENVIRONMENT === 'sandbox'
      ? OAuthClient.environment.sandbox
      : OAuthClient.environment.production;

  oauthClient
    .makeApiCall({ url: `${url}v3/company/${companyID}/companyinfo/${companyID}` })
    .then((authResponse) => res.json(authResponse.json))
    .catch((e) => res.status(400).json({ error: e.message }));
});

/**
 * Start the server
 * @returns {void}
 */
const server = app.listen(process.env.PORT || 8081, async () => {
  console.log(`Server listening on http://localhost:${server.address().port}`);
}).on('error', (err) => {
  console.error('Server error:', err);
});

app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'qbo-demo-ui.html'));
});
