# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> HealthGuard AI E2E Smoke Suite >> Full User Session Flow
- Location: e2e\smoke.spec.ts:4:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForEvent: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for event "download"
============================================================
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - region "Notifications alt+T"
  - generic [ref=e4]:
    - generic [ref=e7]:
      - link "HealthGuard HealthGuard AI" [ref=e9] [cursor=pointer]:
        - /url: /
        - img [ref=e11]
        - generic [ref=e14]:
          - generic [ref=e15]: HealthGuard
          - generic [ref=e16]: HealthGuard AI
      - generic [ref=e17]:
        - generic [ref=e18]:
          - generic [ref=e19]: Health Platform
          - list [ref=e21]:
            - listitem [ref=e22]:
              - link "Dashboard" [ref=e23] [cursor=pointer]:
                - /url: /dashboard
                - img [ref=e25]
                - generic [ref=e30]: Dashboard
            - listitem [ref=e31]:
              - link "Food Scanner" [ref=e32] [cursor=pointer]:
                - /url: /scanner
                - img [ref=e34]
                - generic [ref=e39]: Food Scanner
            - listitem [ref=e40]:
              - link "Action Plan" [ref=e41] [cursor=pointer]:
                - /url: /action-plan
                - img [ref=e43]
                - generic [ref=e51]: Action Plan
            - listitem [ref=e52]:
              - link "Progress" [ref=e53] [cursor=pointer]:
                - /url: /progress
                - img [ref=e55]
                - generic [ref=e57]: Progress
            - listitem [ref=e58]:
              - link "Expert Review" [ref=e59] [cursor=pointer]:
                - /url: /expert-review
                - img [ref=e61]
                - generic [ref=e65]: Expert Review
            - listitem [ref=e66]:
              - link "Profile" [ref=e67] [cursor=pointer]:
                - /url: /profile
                - img [ref=e69]
                - generic [ref=e72]: Profile
        - generic [ref=e73]:
          - generic [ref=e74]: Resources
          - list [ref=e76]:
            - listitem [ref=e77]:
              - link "About" [ref=e78] [cursor=pointer]:
                - /url: /about
                - img [ref=e80]
                - generic [ref=e82]: About
            - listitem [ref=e83]:
              - link "Support" [ref=e84] [cursor=pointer]:
                - /url: /contact
                - img [ref=e86]
                - generic [ref=e93]: Support
      - generic [ref=e95]: HealthGuard v1.0
    - generic [ref=e96]:
      - banner [ref=e97]:
        - button "Toggle Sidebar" [ref=e98] [cursor=pointer]:
          - img
          - generic [ref=e99]: Toggle Sidebar
        - generic [ref=e100]: HealthGuard Clinical Platform
        - generic [ref=e101]:
          - button "Change language" [ref=e102]:
            - img [ref=e103]
            - generic [ref=e106]: English
            - img [ref=e107]
          - button "STP Smoke Test Patient" [ref=e109] [cursor=pointer]:
            - generic [ref=e111]: STP
            - generic [ref=e112]: Smoke Test Patient
      - main [ref=e113]:
        - generic [ref=e114]:
          - generic [ref=e115]:
            - generic [ref=e116]:
              - generic [ref=e117]: Clinical Risk Engine
              - heading "Risk Dashboard" [level=1] [ref=e118]
              - paragraph [ref=e119]: Generated for a 35-year-old male, BMI 24.9.
            - generic [ref=e120]:
              - link "Action Impact Explorer" [ref=e121] [cursor=pointer]:
                - /url: /simulator
              - link "Re-run Assessment" [ref=e122] [cursor=pointer]:
                - /url: /assessment
              - button "Download Report" [active] [ref=e123] [cursor=pointer]:
                - img
                - text: Download Report
          - generic [ref=e124]:
            - generic [ref=e126]:
              - heading "Risk Overview" [level=2] [ref=e127]
              - generic [ref=e128]:
                - generic [ref=e129]:
                  - generic [ref=e130]: ✓
                  - generic [ref=e131]: Assessment Complete
                - generic [ref=e132]:
                  - generic [ref=e133]: ✓
                  - generic [ref=e134]: Risk Profile Generated
                - generic [ref=e135]:
                  - generic [ref=e136]:
                    - text: "Next Recommended Step:"
                    - heading "Scan your first food item" [level=4] [ref=e137]
                    - paragraph [ref=e138]: Use our AI scanner to assess packaged ingredient safety against your health risks.
                  - link "Open Scanner" [ref=e139] [cursor=pointer]:
                    - /url: /scanner
            - generic [ref=e140]:
              - generic [ref=e142]: Assessment Validity
              - generic [ref=e143]:
                - generic [ref=e144]:
                  - paragraph [ref=e145]: Profile Age
                  - heading "Today" [level=3] [ref=e146]
                - generic [ref=e147]: "Completed: N/A"
              - link "Update Assessment" [ref=e149] [cursor=pointer]:
                - /url: /assessment
          - generic [ref=e150]:
            - generic [ref=e153]:
              - generic [ref=e154]:
                - img [ref=e156]
                - generic [ref=e164]:
                  - generic [ref=e165]:
                    - heading "Health Coach Check-In" [level=3] [ref=e166]
                    - button "Generate fresh AI nudge" [ref=e167]:
                      - img [ref=e168]
                  - generic [ref=e173]:
                    - paragraph [ref=e174]: "Current focus: Reduce sedentary lifestyle."
                    - paragraph [ref=e175]: "Next action: Take a 15-minute walk tomorrow morning."
              - link "Go to Action Plan" [ref=e176] [cursor=pointer]:
                - /url: /action-plan
            - generic [ref=e177]:
              - generic [ref=e179]:
                - generic [ref=e180]:
                  - generic [ref=e181]:
                    - generic [ref=e182]: Overall Risk
                    - button [ref=e183] [cursor=pointer]:
                      - img [ref=e184]
                  - generic [ref=e187]: 48%
                  - generic [ref=e188]: Moderate Risk
                - generic [ref=e190]:
                  - generic [ref=e191]: Condition Risks Breakdown
                  - generic [ref=e193]:
                    - generic [ref=e194]: Diabetes
                    - generic [ref=e195]: 67%
                  - generic [ref=e199]:
                    - generic [ref=e200]: Heart Disease
                    - generic [ref=e201]: 25%
                  - generic [ref=e205]:
                    - generic [ref=e206]: Hypertension
                    - generic [ref=e207]: 21%
              - generic [ref=e210]:
                - generic [ref=e212]:
                  - img [ref=e213]
                  - text: Lifestyle Impact Factors
                - generic [ref=e222]:
                  - img [ref=e223]
                  - generic [ref=e231]: No active risk drivers identified. Your health profile looks excellent!
              - generic [ref=e232]:
                - generic [ref=e235]:
                  - img [ref=e236]
                  - text: Prevention Action Priorities
                - generic [ref=e240]:
                  - generic [ref=e241]:
                    - generic [ref=e242]:
                      - img [ref=e243]
                      - generic [ref=e246]:
                        - paragraph [ref=e247]: Exercise 30 min/day (5x/week)
                        - paragraph [ref=e248]: ↓ 19 pts estimated
                    - generic [ref=e249]: Why? Action targets your main clinical risk metrics.
                  - generic [ref=e250]:
                    - generic [ref=e251]:
                      - img [ref=e252]
                      - generic [ref=e255]:
                        - paragraph [ref=e256]: Consult physician to address active symptoms
                        - paragraph [ref=e257]: ↓ 5 pts estimated
                    - generic [ref=e258]: Why? Action targets your main clinical risk metrics.
            - generic [ref=e260]:
              - generic [ref=e261]:
                - img [ref=e263]
                - generic [ref=e267]:
                  - heading "Expert Clinical Review" [level=3] [ref=e268]
                  - paragraph [ref=e269]: Would you like a human medical expert to review your personalized health risk report?
              - link "Request Review" [ref=e270] [cursor=pointer]:
                - /url: /expert-review
```

# Test source

```ts
  1   | import { test, expect } from "playwright/test";
  2   | 
  3   | test.describe("HealthGuard AI E2E Smoke Suite", () => {
  4   |   test("Full User Session Flow", async ({ page }) => {
  5   |     // 1. LANDING PAGE LOAD
  6   |     console.log("Step 1: Navigating to landing page...");
  7   |     await page.goto("/");
  8   |     await expect(page).toHaveTitle(/HealthGuard/);
  9   |     
  10  |     const branding = page.locator("text=HealthGuard").first();
  11  |     await expect(branding).toBeVisible();
  12  | 
  13  |     // Navigate to Signup page
  14  |     console.log("Step 2: Navigating to signup page...");
  15  |     await page.goto("/signup");
  16  |     await expect(page).toHaveURL(/.*signup/);
  17  | 
  18  |     // 2. ONBOARDING REGISTRATION
  19  |     console.log("Step 3: Registering new user...");
  20  |     const testEmail = `smoke-user-${Date.now()}@example.com`;
  21  |     const testPassword = "SmokePassword123!";
  22  | 
  23  |     await page.fill("input#name", "Smoke Test Patient");
  24  |     await page.fill("input#email", testEmail);
  25  |     await page.fill("input#password", testPassword);
  26  |     await page.fill("input#confirmPassword", testPassword);
  27  | 
  28  |     await page.click('button[type="submit"]');
  29  | 
  30  |     // 3. WIZARD ASSESSMENT
  31  |     console.log("Step 4: Completing assessment questionnaire...");
  32  |     // Wait for redirect to assessment page
  33  |     await page.waitForURL("**/assessment**", { timeout: 15000 });
  34  | 
  35  |     // Step 1: Demographics (Default values: age 35, weight 72, height 170)
  36  |     await expect(page.locator("text=Step 1 of 4")).toBeVisible();
  37  |     await page.click("button:has-text('Continue')");
  38  | 
  39  |     // Step 2: Lifestyle (Default values: never smoked, light exercise)
  40  |     await expect(page.locator("text=Step 2 of 4")).toBeVisible();
  41  |     await page.click("button:has-text('Continue')");
  42  | 
  43  |     // Step 3: Family History
  44  |     await expect(page.locator("text=Step 3 of 4")).toBeVisible();
  45  |     await page.fill('textarea[name="familyHistory"]', "Mother has type 2 diabetes");
  46  |     await page.click("button:has-text('Continue')");
  47  | 
  48  |     // Step 4: Symptoms & Submission
  49  |     await expect(page.locator("text=Step 4 of 4")).toBeVisible();
  50  |     await page.fill('textarea[name="symptoms"]', "Occasional thirst and dry mouth");
  51  |     
  52  |     // Disclaimers verification
  53  |     const disclaimer = page.locator("text=educational health risk assessments");
  54  |     await expect(disclaimer).toBeVisible();
  55  | 
  56  |     console.log("Submitting assessment wizard...");
  57  |     await page.click("button:has-text('Generate')");
  58  | 
  59  |     // 4. VERIFY RESULTS RENDERED
  60  |     console.log("Step 5: Verifying dashboard risk results render...");
  61  |     await page.waitForURL("**/dashboard**", { timeout: 15000 });
  62  |     
  63  |     // Assert 3 V1 clinical condition risk cards
  64  |     await expect(page.locator("text=Diabetes")).toBeVisible();
  65  |     await expect(page.locator("text=Heart Disease")).toBeVisible();
  66  |     await expect(page.locator("text=Hypertension")).toBeVisible();
  67  | 
  68  |     // Verify lack of ML risk cards/claims
  69  |     const mlCard = page.locator("text=Machine Learning");
  70  |     await expect(mlCard).not.toBeVisible();
  71  | 
  72  |     // 5. INSPECT LIFESTYLE IMPACT & ACTION PRIORITIES CARDS
  73  |     console.log("Step 6: Inspecting dashboard details...");
  74  |     await expect(page.locator("text=Lifestyle Impact")).toBeVisible();
  75  |     await expect(page.locator("text=Action Priorities")).toBeVisible();
  76  |     await expect(page.locator("text=Expert Review")).toBeVisible();
  77  | 
  78  |     // 6. PDF REPORT DOWNLOAD TRIGGER
  79  |     console.log("Step 7: Testing PDF report download trigger...");
> 80  |     const downloadPromise = page.waitForEvent("download");
      |                                  ^ Error: page.waitForEvent: Test timeout of 30000ms exceeded.
  81  |     await page.click("button:has-text('Download PDF'), button:has-text('Report')");
  82  |     const download = await downloadPromise;
  83  |     expect(download.suggestedFilename()).toContain("healthguard-report");
  84  | 
  85  |     // 7. LOGOUT FLOW & STORAGE CLEANUP
  86  |     console.log("Step 8: Logging out...");
  87  |     // Click Avatar dropdown
  88  |     await page.click("button:has-text('Smoke Test Patient')");
  89  |     // Click Log Out
  90  |     await page.click("text=Log Out");
  91  | 
  92  |     // Wait for redirect to home or login page
  93  |     await page.waitForURL(/.*login|.*/, { timeout: 10000 });
  94  | 
  95  |     // Assert local storage keys are cleaned up
  96  |     const localStorageKeys = await page.evaluate(() => Object.keys(localStorage));
  97  |     const hgKeys = localStorageKeys.filter(key => key.startsWith("hg."));
  98  |     expect(hgKeys.length).toBe(0);
  99  |   });
  100 | });
  101 | 
```