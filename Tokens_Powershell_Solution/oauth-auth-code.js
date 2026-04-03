"use strict";
// oauth-auth-code.ts
// A minimal Authorization Code flow (confidential client) with refresh support for Microsoft Entra ID v2
// Run: npm run setup
//      npm start
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var open_1 = __importDefault(require("open"));
var node_fetch_1 = __importDefault(require("node-fetch")); // v2
var crypto = __importStar(require("crypto"));
var querystring = __importStar(require("querystring"));
var readlineSync = __importStar(require("readline-sync"));
var PORT = 5173;
var REDIRECT_URI = "http://localhost:".concat(PORT, "/callback");
// Scopes - For Viva Insights orginsights API
var SCOPE = [
    // REQUIRED to get refresh_token
    "offline_access",
    // This should match the API domain your integration calls:
    "https://api.orginsights.viva.office.com/.default",
].join(" ");
// ---- Configuration ----
var CLIENT_ID;
var CLIENT_SECRET;
var TENANT;
var CONNECTOR_ID;
var NOVA_SCALE_UNIT;
// Microsoft Entra ID v2 endpoints (will be set after getting TENANT):
var AUTH_URL;
var TOKEN_URL;
// Generate a cryptographically strong random string
function randomString(bytes) {
    if (bytes === void 0) { bytes = 32; }
    return crypto.randomBytes(bytes).toString("hex");
}
function exchangeAuthCodeForTokens(code) {
    return __awaiter(this, void 0, void 0, function () {
        var body, res, text, json;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    body = {
                        client_id: CLIENT_ID,
                        client_secret: CLIENT_SECRET,
                        grant_type: "authorization_code",
                        code: code,
                        redirect_uri: REDIRECT_URI,
                    };
                    return [4 /*yield*/, (0, node_fetch_1.default)(TOKEN_URL, {
                            method: "POST",
                            headers: { "Content-Type": "application/x-www-form-urlencoded" },
                            body: querystring.stringify(body),
                        })];
                case 1:
                    res = _a.sent();
                    if (!!res.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, res.text()];
                case 2:
                    text = _a.sent();
                    throw new Error("Token exchange failed (".concat(res.status, "): ").concat(text));
                case 3: return [4 /*yield*/, res.json()];
                case 4:
                    json = (_a.sent());
                    return [2 /*return*/, json];
            }
        });
    });
}
function buildAuthUrl() {
    // State + nonce for CSRF/Replay protection
    var state = randomString(16);
    var nonce = randomString(16);
    // For confidential clients with a client_secret, PKCE is optional; we’ll omit it here.
    var params = {
        client_id: CLIENT_ID,
        response_type: "code",
        redirect_uri: REDIRECT_URI,
        response_mode: "query",
        scope: SCOPE,
        state: state,
        nonce: nonce,
        // prompt: "consent", // uncomment if you need to force consent each time
        // login_hint: "user@contoso.com", // optionally pre-fill the login
    };
    console.log("PARAMS:" + JSON.stringify(params));
    var url = "".concat(AUTH_URL, "?").concat(querystring.stringify(params));
    return url;
}
function displayConfiguration(accessToken, refreshToken) {
    var httpAddress = "https://api.orginsights.viva.office.com/v1.0/tenants/".concat(TENANT, "/modis/connectors/HR/ingestions/fileIngestion?connectorId=").concat(CONNECTOR_ID, "&novascaleunit=").concat(NOVA_SCALE_UNIT);
    var refreshTokenUrl = "https://login.microsoftonline.com/".concat(TENANT, "/oauth2/v2.0/token");
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
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var confirmed, app;
        var _this = this;
        return __generator(this, function (_a) {
            // Prompt for configuration
            console.log("=== OAuth Configuration Setup ===\n");
            console.log("⚠️  IMPORTANT: Before proceeding, ensure the following:");
            console.log("   1. Your app registration has the redirect URI configured:");
            console.log("      ".concat(REDIRECT_URI));
            console.log("   2. Required API permissions are added and admin consent is granted:");
            console.log("      - Workplace Analytics: AdministratorSettings.ReadWrite (Delegated)");
            console.log("      - Or the appropriate Viva Insights API permissions");
            console.log("   3. A client secret has been created for your app");
            console.log("      - Make sure to copy the client secret value when created as it won't be shown again\n");
            confirmed = readlineSync.keyInYN("Have you configured the redirect URI and API permissions in Azure AD app registration?");
            if (!confirmed) {
                console.log("\n❌ Please configure the following in Azure Portal:");
                console.log("\n   Step 1 - Configure Redirect URI:");
                console.log("   Azure Portal > App registrations > Your app > Authentication");
                console.log("   Add redirect URI: ".concat(REDIRECT_URI));
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
            console.log("\n=== Org data in M365 Configuration ===\n");
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
            AUTH_URL = "https://login.microsoftonline.com/".concat(TENANT, "/oauth2/v2.0/authorize");
            TOKEN_URL = "https://login.microsoftonline.com/".concat(TENANT, "/oauth2/v2.0/token");
            console.log("\n✅ Configuration loaded:");
            console.log("  Client ID:", CLIENT_ID);
            console.log("  Tenant ID:", TENANT);
            console.log("  Connector ID:", CONNECTOR_ID);
            console.log("  Nova Scale Unit:", NOVA_SCALE_UNIT);
            console.log();
            app = (0, express_1.default)();
            app.get("/callback", function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var _a, code, error, error_description, tokenResponse, e_1;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 2, , 3]);
                            _a = req.query, code = _a.code, error = _a.error, error_description = _a.error_description;
                            if (error) {
                                res.status(400).send("Auth error: ".concat(error, " - ").concat(error_description));
                                return [2 /*return*/];
                            }
                            if (!code) {
                                res.status(400).send("Missing 'code' in query.");
                                return [2 /*return*/];
                            }
                            return [4 /*yield*/, exchangeAuthCodeForTokens(code)];
                        case 1:
                            tokenResponse = _b.sent();
                            // Display complete HRIS Integration configuration
                            displayConfiguration(tokenResponse.access_token, tokenResponse.refresh_token);
                            // Full token output
                            console.log("\n=== Token Details ===");
                            console.log("token_type:", tokenResponse.token_type);
                            console.log("expires_in (sec):", tokenResponse.expires_in);
                            console.log("scopes:", tokenResponse.scope);
                            console.log("=====================\n");
                            res.send("\n        <html>\n        <head>\n          <title>Authorization Complete</title>\n          <style>\n            body { font-family: Arial, sans-serif; padding: 20px; max-width: 1000px; margin: 0 auto; }\n            h2 { color: #0078d4; }\n            h3 { color: #333; margin-top: 25px; }\n            .config-table { width: 100%; border-collapse: collapse; margin: 20px 0; }\n            .config-table th { background: #0078d4; color: white; padding: 12px; text-align: left; }\n            .config-table td { padding: 10px; border: 1px solid #ddd; }\n            .config-table tr:nth-child(even) { background: #f5f5f5; }\n            textarea { width: 100%; font-family: monospace; font-size: 10px; padding: 5px; }\n            .label { font-weight: bold; width: 200px; }\n            .copy-btn { background: #0078d4; color: white; border: none; padding: 5px 10px; cursor: pointer; margin-left: 10px; }\n            .copy-btn:hover { background: #005a9e; }\n          </style>\n        </head>\n        <body>\n          <h2>\u2705 Authorization Complete!</h2>\n          <p>You can close this tab and return to the terminal for the complete configuration.</p>\n          \n          <h3>\uD83D\uDCCB HRIS Integration Configuration</h3>\n          <table class=\"config-table\">\n            <tr>\n              <th colspan=\"2\">Copy these values to your HRIS Integration OAuth 2.0 configuration</th>\n            </tr>\n            <tr>\n              <td class=\"label\">HTTP Address (Org data in M365 API Endpoint)</td>\n              <td><textarea rows=\"3\" readonly>https://api.orginsights.viva.office.com/v1.0/tenants/".concat(TENANT, "/modis/connectors/HR/ingestions/fileIngestion?connectorId=").concat(CONNECTOR_ID, "&novascaleunit=").concat(NOVA_SCALE_UNIT, "</textarea></td>\n            </tr>\n            <tr>\n              <td class=\"label\">Web Service Invocation Type</td>\n              <td>OAuth 2.0</td>\n            </tr>\n            <tr>\n              <td class=\"label\">Access Token</td>\n              <td><textarea rows=\"4\" readonly>").concat(tokenResponse.access_token, "</textarea></td>\n            </tr>\n            <tr>\n              <td class=\"label\">Refresh Token</td>\n              <td><textarea rows=\"3\" readonly>").concat(tokenResponse.refresh_token || "N/A", "</textarea></td>\n            </tr>\n            <tr>\n              <td class=\"label\">Refresh Token URL</td>\n              <td><textarea rows=\"2\" readonly>https://login.microsoftonline.com/").concat(TENANT, "/oauth2/v2.0/token</textarea></td>\n            </tr>\n            <tr>\n              <td class=\"label\">Client ID</td>\n              <td>").concat(CLIENT_ID, "</td>\n            </tr>\n            <tr>\n              <td class=\"label\">Client Secret</td>\n              <td>").concat(CLIENT_SECRET, "</td>\n            </tr>\n          </table>\n          \n          <h3>Token Details</h3>\n          <pre>").concat(JSON.stringify({
                                token_type: tokenResponse.token_type,
                                expires_in: tokenResponse.expires_in,
                                scope: tokenResponse.scope,
                            }, null, 2), "</pre>\n        </body>\n        </html>\n      "));
                            return [3 /*break*/, 3];
                        case 2:
                            e_1 = _b.sent();
                            console.error(e_1);
                            res.status(500).send("Callback error: ".concat((e_1 === null || e_1 === void 0 ? void 0 : e_1.message) || e_1));
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            app.get("/", function (_req, res) {
                res.send("<a href=\"/start\">Start OAuth2 Authorization Code Flow</a>");
            });
            app.get("/start", function (_req, res) { return __awaiter(_this, void 0, void 0, function () {
                var url, e_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            url = buildAuthUrl();
                            // Open system browser for sign-in/consent
                            return [4 /*yield*/, (0, open_1.default)(url)];
                        case 1:
                            // Open system browser for sign-in/consent
                            _a.sent();
                            res.send("<p>Opened browser for sign-in: <a href=\"".concat(url, "\">").concat(url, "</a></p>"));
                            return [3 /*break*/, 3];
                        case 2:
                            e_2 = _a.sent();
                            res.status(500).send("Failed to open browser: ".concat((e_2 === null || e_2 === void 0 ? void 0 : e_2.message) || e_2));
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            }); });
            app.listen(PORT, function () {
                var startUrl = "http://localhost:".concat(PORT, "/start");
                console.log("Server listening on http://localhost:".concat(PORT));
                console.log("Start the flow: ".concat(startUrl));
                (0, open_1.default)(startUrl).catch(function () {
                    console.log("If the browser didn't open, visit: ".concat(startUrl));
                });
                console.log('Wait a few seconds and follow the instructions in the opened browser to complete the OAuth2 Authorization Code flow.');
            });
            return [2 /*return*/];
        });
    });
}
main().catch(function (err) {
    console.error(err);
    process.exit(1);
});
"";
