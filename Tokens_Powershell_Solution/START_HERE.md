# 🚀 START HERE

Welcome to the OAuth Token Generator for HRIS Integration Integration!

## New User? Follow These Steps:

### Before running the script, you'll need the following information:
- **App registration details** from Azure Portal
  - Application (client) ID
  - Client secret
  - Directory (tenant) ID
- **Connector Details** from _Org data in M365_:
  - Connector ID (from API connector URL)
  - Nova Scale Unit (from API connector setup)

### If you don't have all the information above:
👉 **Go to `FULL_INSTRUCTIONS.md`** for detailed Azure AD app registration setup.

This provides step-by-step instructions with screenshots for:
- Creating/configuring your Azure AD app registration
- Adding API permissions
- Setting up authentication
- Getting _Org data in M365_ configuration details (Connector ID and Nova Scale Unit)
- Configuring HRIS Integration (if using Workday EIB)
- Troubleshooting common issues

### If you already have the information above:
👉 **Go to `QUICKSTART.md`** for quick installation and running the program.

This will get you up and running in minutes with basic setup commands.

---

## Quick Summary:

1. **Install Node.js** (if not already installed)
   - Download from: https://nodejs.org/
   - This includes npm which is required for the next steps
   - Verify by running: `node --version` and `npm --version`
2. **Clone** this github repo
3. **Open PowerShell/Command Prompt** in this folder
4. **Run**: `npm run setup`
   - If you get `'npm' is not recognized`, install Node.js first (step 1)
5. **Get required info listed at the top**
6. **Run**: `npm start`
7. **Follow the prompts** in the program
8. **Copy configuration**: The program will display all HRIS Integration configuration values!

For detailed Azure AD configuration, refer to `FULL_INSTRUCTIONS.md`.

---

**Need Help?** Check the Troubleshooting section in `FULL_INSTRUCTIONS.md`
