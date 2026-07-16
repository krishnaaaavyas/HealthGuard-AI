const { chromium } = require("playwright");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

// Ensure output directory exists
const outputDir = path.join(__dirname, "..", "docs", "visual-baselines");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function runCapture() {
  console.log("==================================================");
  console.log("HEALTHGUARD AI AUTOMATED VISUAL REGRESSION BASELINE");
  console.log("==================================================");

  // 1. Boot local dev server on port 5173
  console.log("Starting local Vite development server...");
  const viteProcess = spawn("npx", ["vite", "--port", "5173", "--strictPort"], {
    shell: true,
    cwd: path.join(__dirname, ".."),
  });

  // Wait for dev server to boot
  await new Promise((resolve) => {
    const fallbackTimeout = setTimeout(() => {
      console.log("Vite boot check timed out; continuing via fallback safety...");
      resolve();
    }, 8000);

    viteProcess.stdout.on("data", (data) => {
      const output = data.toString();
      console.log("[Vite]", output.trim());
      if (output.includes("Local:") || output.includes("localhost:5173")) {
        clearTimeout(fallbackTimeout);
        resolve();
      }
    });
  });

  // Give it an extra second to load plugins
  await new Promise((r) => setTimeout(r, 2000));

  console.log("Launching headless browser with sandbox bypass...");
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  console.log("Browser launched successfully.");
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  const capture = async (name, urlPath) => {
    console.log(`Navigating to: ${urlPath}...`);
    await page.goto(`http://localhost:5173${urlPath}`, { waitUntil: "networkidle" });
    // Let any dynamic animations settle
    await page.waitForTimeout(1500);
    const screenshotPath = path.join(outputDir, `${name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Screenshot captured: docs/visual-baselines/${name}.png`);
  };

  try {
    // Landing page
    await capture("landing", "/");

    // Login page
    await capture("login", "/login");

    // Signup page
    await capture("signup", "/signup");

    // Start E2E Registration and Wizard Onboarding
    console.log("Filling E2E registration form...");
    const testEmail = `baseline-user-${Date.now()}@gmail.com`;
    const testPassword = "TestPassword123!";

    await page.fill('input#name', "Test Patient");
    await page.fill('input#email', testEmail);
    await page.fill('input#password', testPassword);
    await page.fill('input#confirmPassword', testPassword);

    console.log("Submitting registration...");
    await page.click('button[type="submit"]');

    // Wait for redirect to assessment wizard
    console.log("Waiting for redirection to health assessment page...");
    await page.waitForURL("**/assessment**", { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Assessment Step 1 screenshot
    const stepScreenshotPath = (step) => path.join(outputDir, `assessment-step${step}.png`);
    
    console.log("Capturing Assessment Step 1...");
    await page.screenshot({ path: stepScreenshotPath(1), fullPage: true });

    // Click Continue (Step 1 is pre-populated with valid defaults)
    console.log("Submitting Step 1...");
    await page.click("button:has-text('Continue')");
    await page.waitForTimeout(1000);

    // Step 2
    console.log("Capturing Assessment Step 2...");
    await page.screenshot({ path: stepScreenshotPath(2), fullPage: true });
    console.log("Submitting Step 2...");
    await page.click("button:has-text('Continue')");
    await page.waitForTimeout(1000);

    // Step 3
    console.log("Capturing Assessment Step 3...");
    await page.screenshot({ path: stepScreenshotPath(3), fullPage: true });
    console.log("Filling and Submitting Step 3...");
    await page.fill('textarea[name="familyHistory"]', "No family history of heart issues.");
    await page.click("button:has-text('Continue')");
    await page.waitForTimeout(1000);

    // Step 4
    console.log("Capturing Assessment Step 4...");
    await page.screenshot({ path: stepScreenshotPath(4), fullPage: true });
    console.log("Filling and Submitting Step 4...");
    await page.fill('textarea[name="symptoms"]', "None");
    
    console.log("Submitting wizard assessment...");
    // The button on Step 4 has text containing "Generate Plan"
    await page.click("button:has-text('Generate')");

    // Wait for redirection to dashboard
    console.log("Waiting for dashboard redirect...");
    await page.waitForURL("**/dashboard**", { timeout: 15000 });
    await page.waitForTimeout(4000); // Allow charts/results to fetch and animate

    // Capture Dashboard
    console.log("Capturing Dashboard...");
    await page.screenshot({ path: path.join(outputDir, "dashboard.png"), fullPage: true });

    // Capture Progress Page
    await capture("progress", "/progress");

    // Capture Profile Page
    await capture("profile", "/profile");

    // Capture Report Page
    await capture("report", "/report");

    console.log("All E2E screenshots successfully captured.");

  } catch (err) {
    console.error("Visual regression capture pipeline failed:", err);
  } finally {
    console.log("Cleaning up resources...");
    await browser.close();
    viteProcess.kill();
    console.log("Vite development server stopped.");
    console.log("==================================================");
  }
}

runCapture();
