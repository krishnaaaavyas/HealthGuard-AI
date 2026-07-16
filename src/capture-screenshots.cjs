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
    viteProcess.stdout.on("data", (data) => {
      const output = data.toString();
      console.log("[Vite]", output.trim());
      if (output.includes("Local:") || output.includes("localhost:5173")) {
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
    const testEmail = `baseline-user-${Date.now()}@healthguard-ai.mock`;
    const testPassword = "TestPassword123!";

    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    
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

    // Fill Step 1
    console.log("Filling Step 1...");
    await page.fill('input[name="age"]', "35");
    
    // Select gender option via select component or fallback
    const genderSelect = await page.$("button:has-text('Select gender')");
    if (genderSelect) {
      await genderSelect.click();
      await page.click('span:has-text("Male")');
    } else {
      await page.selectOption('select[name="gender"]', "male");
    }

    await page.fill('input[name="heightCm"]', "175");
    await page.fill('input[name="weightKg"]', "75");
    await page.click("button:has-text('Next')");
    await page.waitForTimeout(1000);

    // Fill Step 2
    console.log("Capturing and Filling Step 2...");
    await page.screenshot({ path: stepScreenshotPath(2), fullPage: true });
    const smokingSelect = await page.$("button:has-text('Select smoking')");
    if (smokingSelect) {
      await smokingSelect.click();
      await page.click('span:has-text("Never smoked")');
    }
    const exerciseSelect = await page.$("button:has-text('Select active')");
    if (exerciseSelect) {
      await exerciseSelect.click();
      await page.click('span:has-text("Moderate")');
    }
    await page.click("button:has-text('Next')");
    await page.waitForTimeout(1000);

    // Fill Step 3
    console.log("Capturing and Filling Step 3...");
    await page.screenshot({ path: stepScreenshotPath(3), fullPage: true });
    await page.fill('textarea[name="familyHistory"]', "No family history of heart issues.");
    await page.click("button:has-text('Next')");
    await page.waitForTimeout(1000);

    // Fill Step 4
    console.log("Capturing and Submitting Step 4...");
    await page.screenshot({ path: stepScreenshotPath(4), fullPage: true });
    await page.fill('textarea[name="symptoms"]', "None");
    
    console.log("Submitting wizard assessment...");
    await page.click("button:has-text('Complete')");

    // Wait for redirection to dashboard
    console.log("Waiting for dashboard redirect...");
    await page.waitForURL("**/dashboard**", { timeout: 15000 });
    await page.waitForTimeout(3000); // Allow charts/results to fetch and animate

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
