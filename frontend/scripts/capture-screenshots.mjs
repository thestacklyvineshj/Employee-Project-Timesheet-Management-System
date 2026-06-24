import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', '..', 'screenshots');
const baseUrl = 'http://localhost:5173';

async function login(page, email, password) {
  await page.goto(`${baseUrl}/login`);
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(employee|manager)/, { timeout: 15000 });
}

async function capture(page, name) {
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`Saved ${file}`);
}

async function main() {
  await mkdir(outDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });

  await page.goto(`${baseUrl}/login`);
  await page.waitForTimeout(1000);
  await capture(page, '01-login');

  await login(page, 'bob@demo.com', 'employee123');
  await page.waitForTimeout(1000);
  await capture(page, '02-employee-dashboard');

  await page.goto(`${baseUrl}/employee/submit`);
  await page.waitForTimeout(1000);
  await capture(page, '03-submit-timesheet');

  await page.goto(`${baseUrl}/employee/history`);
  await page.waitForTimeout(1000);
  await capture(page, '04-timesheet-history');

  await page.goto(`${baseUrl}/login`);
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${baseUrl}/login`);
  await page.waitForSelector('#email');
  await login(page, 'manager@demo.com', 'manager123');
  await page.waitForTimeout(1000);
  await capture(page, '05-manager-dashboard');

  await page.goto(`${baseUrl}/manager/projects`);
  await page.waitForTimeout(1000);
  await capture(page, '06-project-management');

  await page.goto(`${baseUrl}/manager/assignments`);
  await page.waitForTimeout(1000);
  await capture(page, '07-employee-assignment');

  await page.goto(`${baseUrl}/manager/timesheets`);
  await page.waitForTimeout(1000);
  await capture(page, '08-timesheet-monitoring');

  await page.goto(`${baseUrl}/manager/reports`);
  await page.waitForTimeout(2000);
  await capture(page, '09-reports');

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
