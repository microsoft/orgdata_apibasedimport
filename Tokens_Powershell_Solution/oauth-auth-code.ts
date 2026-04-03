// oauth-auth-code.ts
// A minimal Authorization Code flow (confidential client) with refresh support for Microsoft Entra ID v2
// Run: npm run setup
//      npm start

import express, { Request, Response } from "express";
import open from "open";
import fetch from "node-fetch"; // v2
import * as crypto from "crypto";
import * as querystring from "querystring";
import * as readlineSync from "readline-sync";

const PORT = 5173;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;

const SCOPE = [
  // REQUIRED to get refresh_token
  "offline_access",
  
  // This should match the API domain your integration calls:
  "https://api.orginsights.viva.office.com/.default",
].join(" ");

// ---- Configuration ----
let CLIENT_ID: string;
let CLIENT_SECRET: string;
let TENANT: string;
let CONNECTOR_ID: string;
let NOVA_SCALE_UNIT: string;

// Microsoft Entra ID v2 endpoints (will be set after getting TENANT):
let AUTH_URL: string;
let TOKEN_URL: string;

type TokenResponse = {
  token_type: string;
  scope?: string;
  expires_in: number;
  ext_expires_in?: number;
  access_token: string;
  refresh_token?: string;
  id_token?: string;
};

// Generate a cryptographically strong random string
function randomString(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

async function exchangeAuthCodeForTokens(code: string): Promise<TokenResponse> {
  const body = {
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
  };

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: querystring.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed (${res.status}): ${text}`);
  }

  const json = (await res.json()) as TokenResponse;
  return json;
}

function buildAuthUrl(): string {
  // State + nonce for CSRF/Replay protection
  const state = randomString(16);
  const nonce = randomString(16);

  // For confidential clients with a client_secret, PKCE is optional; we’ll omit it here.

  const params = {
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    response_mode: "query",
    scope: SCOPE,
    state,
    nonce,
    // prompt: "consent", // uncomment if you need to force consent each time
    // login_hint: "user@contoso.com", // optionally pre-fill the login
  };
  console.log("PARAMS:" + JSON.stringify(params));

  const url = `${AUTH_URL}?${querystring.stringify(params)}`;
  return url;
}

function displayConfiguration(accessToken: string, refreshToken: string | undefined) {
  const httpAddress = `https://api.orginsights.viva.office.com/v1.0/tenants/${TENANT}/modis/connectors/HR/ingestions/fileIngestion?connectorId=${CONNECTOR_ID}&novascaleunit=${NOVA_SCALE_UNIT}`;
  const refreshTokenUrl = `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/token`;
  
  console.log("\n");
  console.log("═══════════════════════════════════════════════════════════════════════════════");
  console.log("                        CONFIGURATION - COPY THESE VALUES                      ");
  console.log("═══════════════════════════════════════════════════════════════════════════════");
  console.log();
  console.log("📋 Use these values in your HRIS Integration OAuth 2.0 configuration:");
  console.log();
  console.log("┌─────────────────────────────────────────────────────────────────────────────┐");
  console.log("│ HTTP Address (Org data in M365 API Endpoint)                                │");
  console.log("└─────────────────────────────────────────────────────────────────────────────┘");
  console.log(httpAddress);
  console.log();
  console.log("┌─────────────────────────────────────────────────────────────────────────────┐");
  console.log("│ Web Service Invocation Type                                                 │");
  console.log("└─────────────────────────────────────────────────────────────────────────────┘");
  console.log("OAuth 2.0");
  console.log();
  console.log("┌─────────────────────────────────────────────────────────────────────────────┐");
  console.log("│ Access Token                                                                │");
  console.log("└─────────────────────────────────────────────────────────────────────────────┘");
  console.log(accessToken);
  console.log();
  console.log("┌─────────────────────────────────────────────────────────────────────────────┐");
  console.log("│ Refresh Token                                                               │");
  console.log("└─────────────────────────────────────────────────────────────────────────────┘");
  console.log(refreshToken || "N/A");
  console.log();
  console.log("┌─────────────────────────────────────────────────────────────────────────────┐");
  console.log("│ Refresh Token URL                                                           │");
  console.log("└─────────────────────────────────────────────────────────────────────────────┘");
  console.log(refreshTokenUrl);
  console.log();
  console.log("┌─────────────────────────────────────────────────────────────────────────────┐");
  console.log("│ Client ID                                                                   │");
  console.log("└─────────────────────────────────────────────────────────────────────────────┘");
  console.log(CLIENT_ID);
  console.log();
  console.log("┌─────────────────────────────────────────────────────────────────────────────┐");
  console.log("│ Client Secret                                                               │");
  console.log("└─────────────────────────────────────────────────────────────────────────────┘");
  console.log(CLIENT_SECRET);
  console.log();
  console.log("═══════════════════════════════════════════════════════════════════════════════");
  console.log();
}

async function main() {
  // Prompt for configuration
  console.log("=== OAuth Configuration Setup ===\n");
  
  console.log("⚠️  IMPORTANT: Before proceeding, ensure the following:");
  console.log("   1. Your app registration has the redirect URI configured:");
  console.log(`      ${REDIRECT_URI}`);
  console.log("   2. Required API permissions are added and admin consent is granted:");
  console.log("      - Workplace Analytics: AdministratorSettings.ReadWrite (Delegated)");
  console.log("   3. A client secret has been created for your app");
  console.log("      - Make sure to copy the client secret value when created as it won't be shown again\n");
  
  const confirmed = readlineSync.keyInYN("Have you configured the redirect URI and API permissions in Azure AD app registration?");
  if (!confirmed) {
    console.log("\n❌ Please configure the following in Azure Portal:");
    console.log("\n   Step 1 - Configure Redirect URI:");
    console.log("   Azure Portal > App registrations > Your app > Authentication");
    console.log(`   Add redirect URI: ${REDIRECT_URI}`);
    console.log("   Platform: Web");
    console.log("\n   Step 2 - Add API Permissions:");
    console.log("   Azure Portal > App registrations > Your app > API permissions");
    console.log("   Add permission > Workplace Analytics > Delegated permissions");
    console.log("   Select: AdministratorSettings.ReadWrite");
    console.log("   Click 'Grant admin consent'\n");
    process.exit(0);
  }
  
  console.log();
  
  console.log("Enter Client ID:");
  console.log("(Find in Azure Portal > App registrations > Your app > Overview > Application (client) ID)");
  CLIENT_ID = readlineSync.question("> ");
  while (!CLIENT_ID || CLIENT_ID.trim() === "") {
    console.log("❌ Client ID is required!");
    CLIENT_ID = readlineSync.question("> ");
  }
  
  console.log("\nEnter Client Secret:");
  console.log("(Find in Azure Portal > App registrations > Your app > Certificates & secrets > Client secrets > Value)");
  console.log("(Note: If you don't have one, create a new client secret first)");
  CLIENT_SECRET = readlineSync.question("> ", {
    hideEchoBack: true
  });
  while (!CLIENT_SECRET || CLIENT_SECRET.trim() === "") {
    console.log("❌ Client Secret is required!");
    CLIENT_SECRET = readlineSync.question("> ", {
      hideEchoBack: true
    });
  }
  
  console.log("\nEnter Tenant ID:");
  console.log("(Find in Azure Portal > App registrations > Your app > Overview > Directory (tenant) ID)");
  TENANT = readlineSync.question("> ");
  while (!TENANT || TENANT.trim() === "") {
    console.log("❌ Tenant ID is required!");
    TENANT = readlineSync.question("> ");
  }

  console.log("\n=== Org data in M365 Connector details ===\n");
  
  console.log("Enter Connector ID:");
  console.log("(Find in Org data in M365 > API-based connector page URL)");
  console.log("(See screenshot in README for reference)");
  CONNECTOR_ID = readlineSync.question("> ");
  while (!CONNECTOR_ID || CONNECTOR_ID.trim() === "") {
    console.log("❌ Connector ID is required!");
    CONNECTOR_ID = readlineSync.question("> ");
  }
  
  console.log("\nEnter Nova Scale Unit:");
  console.log("(Find in Org data in M365 > API-based connector *setup* > At the bottom of Step 2 'Prepare data')");
  console.log("(See screenshot in README for reference)");
  NOVA_SCALE_UNIT = readlineSync.question("> ");
  while (!NOVA_SCALE_UNIT || NOVA_SCALE_UNIT.trim() === "") {
    console.log("❌ Nova Scale Unit is required!");
    NOVA_SCALE_UNIT = readlineSync.question("> ");
  }

  // Set up the URLs after getting TENANT
  AUTH_URL = `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/authorize`;
  TOKEN_URL = `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/token`;

  console.log("\n✅ Configuration loaded:");
  console.log("  Client ID:", CLIENT_ID);
  console.log("  Tenant ID:", TENANT);
  console.log("  Connector ID:", CONNECTOR_ID);
  console.log("  Nova Scale Unit:", NOVA_SCALE_UNIT);
  console.log();

  const app = express();

  app.get("/callback", async (req: Request, res: Response) => {
    try {
      const { code, error, error_description } = req.query as Record<string, string>;

      if (error) {
        res.status(400).send(`Auth error: ${error} - ${error_description}`);
        return;
      }
      if (!code) {
        res.status(400).send("Missing 'code' in query.");
        return;
      }

      const tokenResponse = await exchangeAuthCodeForTokens(code);

      // Display complete HRIS Integration configuration
      displayConfiguration(tokenResponse.access_token, tokenResponse.refresh_token);

      // Full token output
      console.log("\n=== Token Details ===");
      console.log("token_type:", tokenResponse.token_type);
      console.log("expires_in (sec):", tokenResponse.expires_in);
      console.log("scopes:", tokenResponse.scope);
      console.log("=====================\n");

      res.send(`
        <html>
        <head>
          <title>Authorization Complete</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 1000px; margin: 0 auto; }
            h2 { color: #0078d4; }
            h3 { color: #333; margin-top: 25px; }
            .config-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .config-table th { background: #0078d4; color: white; padding: 12px; text-align: left; }
            .config-table td { padding: 10px; border: 1px solid #ddd; }
            .config-table tr:nth-child(even) { background: #f5f5f5; }
            textarea { width: 100%; font-family: monospace; font-size: 10px; padding: 5px; }
            .label { font-weight: bold; width: 200px; }
            .copy-btn { background: #0078d4; color: white; border: none; padding: 5px 10px; cursor: pointer; margin-left: 10px; }
            .copy-btn:hover { background: #005a9e; }
          </style>
        </head>
        <body>
          <h2>✅ Authorization Complete!</h2>
          <p>You can close this tab and return to the terminal for the complete configuration.</p>
          
          <h3>📋 HRIS Integration Configuration</h3>
          <table class="config-table">
            <tr>
              <th colspan="2">Copy these values to your HRIS Integration OAuth 2.0 configuration</th>
            </tr>
            <tr>
              <td class="label">HTTP Address (Org data in M365 API Endpoint)</td>
              <td><textarea rows="3" readonly>https://api.orginsights.viva.office.com/v1.0/tenants/${TENANT}/modis/connectors/HR/ingestions/fileIngestion?connectorId=${CONNECTOR_ID}&novascaleunit=${NOVA_SCALE_UNIT}</textarea></td>
            </tr>
            <tr>
              <td class="label">Web Service Invocation Type</td>
              <td>OAuth 2.0</td>
            </tr>
            <tr>
              <td class="label">Access Token</td>
              <td><textarea rows="4" readonly>${tokenResponse.access_token}</textarea></td>
            </tr>
            <tr>
              <td class="label">Refresh Token</td>
              <td><textarea rows="3" readonly>${tokenResponse.refresh_token || "N/A"}</textarea></td>
            </tr>
            <tr>
              <td class="label">Refresh Token URL</td>
              <td><textarea rows="2" readonly>https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/token</textarea></td>
            </tr>
            <tr>
              <td class="label">Client ID</td>
              <td>${CLIENT_ID}</td>
            </tr>
            <tr>
              <td class="label">Client Secret</td>
              <td>${CLIENT_SECRET}</td>
            </tr>
          </table>
          
          <h3>Token Details</h3>
          <pre>${JSON.stringify(
            {
              token_type: tokenResponse.token_type,
              expires_in: tokenResponse.expires_in,
              scope: tokenResponse.scope,
            },
            null,
            2
          )}</pre>
        </body>
        </html>
      `);
    } catch (e: any) {
      console.error(e);
      res.status(500).send(`Callback error: ${e?.message || e}`);
    }
  });

  app.get("/", (_req: Request, res: Response) => {
    res.send(`<a href="/start">Start OAuth2 Authorization Code Flow</a>`);
  });

  app.get("/start", async (_req: Request, res: Response) => {
    try {
      const url = buildAuthUrl();
      // Open system browser for sign-in/consent
      await open(url);
      res.send(`<p>Opened browser for sign-in: <a href="${url}">${url}</a></p>`);
    } catch (e: any) {
      res.status(500).send(`Failed to open browser: ${e?.message || e}`);
    }
  });

  app.listen(PORT, () => {
    const startUrl = `http://localhost:${PORT}/start`;
    console.log(`Server listening on http://localhost:${PORT}`);
    console.log(`Start the flow: ${startUrl}`);
    open(startUrl).catch(() => {
      console.log(`If the browser didn't open, visit: ${startUrl}`);
    });
    console.log('Wait a few seconds and follow the instructions in the opened browser to complete the OAuth2 Authorization Code flow.');
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
``