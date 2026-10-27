# Sample Code for API Based Organizational Data Upload

[Microsoft 365 Organizational Data Service](https://go.microsoft.com/fwlink/?linkid=2339569) allows Microsoft customers to send organizational data (data associated with users) from their HR systems to Microsoft. The ingested organizational data is used to light up multiple scenarios and functionality within Microsoft 365 and Viva Employee Experience platform.

We support multiple connector types to allow customers to setup automated data connectors to ensure the organizational data remains fresh which helps improve the quality of the experiences.

The sample C# application and PowerShell scripts provided in this project can be used when setting up the API based connector type.

1. C#_Upload_Solution: This requires running C# code in visual studio/command line.
2. PowerShell_Upload_Solution: Uploads CSV files using Windows PowerShell 5.1 or PowerShell 7. Requires MSAL.PS installed in the PowerShell edition used to run it.
3. PowerShell_Token_Solution: A standalone PowerShell helper for obtaining access and refresh tokens for an HRIS integration; it does *not* upload a CSV file. Supports Windows PowerShell 5.1 and PowerShell 7.

Customers can use any method to extract data from the HRIS system into a CSV file. Ideally, they are able to set up an extraction job to take a snapshot of the organizational data as a CSV file at regular intervals and then run either the C# application or Powershell upload script to call the public export API to push the organizational data file to Microsoft.

## For more information, follow the [API-based import documentation](https://go.microsoft.com/fwlink/?linkid=2337669).
