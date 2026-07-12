# CiviCore-Net Security Strategy

These acronyms represent the industry standard layers of a "Defense in Depth" strategy. Because CiviCore-Net uses **.NET Core (Backend)**, **Next.js/React (Frontend)**, and **Docker on AWS Lightsail**, here is exactly how to implement these for the code and server, and the best tools to use:

## 1. SCA & SAST (Static Analysis - Checking the Code)
This checks the source code and downloaded libraries *before* the app even runs.

### SCA (Software Composition Analysis)
Checks if third-party libraries (NuGet or npm packages) have known vulnerabilities.
* **How to run:** 
  * For Backend (.NET): Run `dotnet list package --vulnerable`
  * For Frontend (Next.js/React): Run `npm audit` in the respective directories.

### SAST (Static Application Security Testing)
Scans custom C# and TypeScript code for bad practices (like hardcoding passwords or SQL injection).
* **Recommended Tool:** **SonarQube** (or SonarCloud). 
* **Implementation:** It is the industry standard and free for open-source or small projects. Connect it to the GitHub repository, and every time code is pushed, it reads it and warns of security flaws.

#### How to Scan with SonarQube locally
Assuming SonarQube is running on `http://localhost:9000` with your token.

**1. Scan the .NET Backend (`CiviCore.Api`):**
First, install the global tool (only once):
```powershell
dotnet tool install --global dotnet-sonarscanner
```
Then run the scan sequence in the root folder:
```powershell
dotnet sonarscanner begin /k:"civicore-backend" /d:sonar.host.url="http://localhost:9000" /d:sonar.token="YOUR_TOKEN"
dotnet build CiviCore.sln
dotnet sonarscanner end /d:sonar.token="YOUR_TOKEN"
```

**2. Scan the Admin Frontend (`CiviCore.Frontend`):**
Inside the `CiviCore.Frontend` folder:
```powershell
npx sonar-scanner -D"sonar.projectKey=civicore-admin-frontend" -D"sonar.sources=src" -D"sonar.host.url=http://localhost:9000" -D"sonar.token=YOUR_TOKEN"
```

**3. Scan the Resident Web (`CiviCore.Web`):**
Inside the `CiviCore.Web` folder:
```powershell
npx sonar-scanner -D"sonar.projectKey=civicore-resident-web" -D"sonar.sources=src" -D"sonar.host.url=http://localhost:9000" -D"sonar.token=YOUR_TOKEN"
```

---

## 2. DAST (Dynamic Analysis - Hacking the Running App)
This analyzes the application *from the outside* while it is running, simulating what a real automated hacker would do (trying to bypass auth, send bad headers, etc.).

* **Recommended Tool:** **OWASP ZAP (Zed Attack Proxy)**. It is completely free and open-source.
* **Implementation:** Download OWASP ZAP to a local computer, type in the staging website URL (or `localhost`), and click "Attack." It will crawl the CiviCore frontend and hammer the CiviCore API looking for vulnerabilities like missing security headers or Cross-Site Scripting (XSS).

---

## 3. VA (Vulnerability Assessment - Checking the Server)
This scans the AWS Lightsail server, operating system (Ubuntu), and Docker containers for unpatched software (like an old version of Nginx or SSH).

* **Recommended Tool:** **Trivy** by Aqua Security.
* **Implementation:** Trivy is an amazing, free command-line tool. Before deploying a Docker image, run `trivy image civicore-api`. It will instantly report if the Microsoft base image or Alpine Linux being used has any known CVEs (Common Vulnerabilities and Exposures).

---

## 4. PT (Penetration Testing - Human Hackers)
This is a manual process where a human cybersecurity professional tries to find business logic flaws that automated tools miss (e.g., "Can Resident A somehow view Resident B's payment history by changing the ID in the URL?").

* **Implementation:** Professional PT is very expensive ($5,000 - $20,000+). Because CiviCore-Net utilizes third-party gateways (Midtrans/Xendit) and doesn't store raw credit cards natively, professional PT is not strictly needed until a corporate client demands it.
* **Alternative (Peer Review):** Do a "Peer Review" PT: Ask another developer to log in as a Resident and actively try to break into the Admin dashboard.

---

## Summary for CiviCore-Net
To level up security without spending money, the immediate recommendations are:
1. Download **OWASP ZAP** (for DAST).
2. Install **Trivy** (for VA on Docker containers). 

Those two free tools will catch 95% of the automated vulnerabilities hackers look for.
