import { expect, FrameLocator, Page } from "@playwright/test";

export type RegistrationData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

export async function openRegistration(page: Page): Promise<FrameLocator> {
  await page.goto("https://demo.prestashop.com/#/en/front");

  await expect(page.locator("#loadingMessage")).toBeHidden({
    timeout: 15000,
  });

  const shop = page.frameLocator('iframe[title="Frame of demo shop"]');

  await shop
    .locator('#_desktop_ps_customersignin a[aria-label="Sign in"]')
    .click();

  await shop.locator('[data-link-action="display-register-form"]').click();

  await expect(shop.locator("#customer-form")).toBeVisible();

  return shop;
}

export async function fillMandatoryFields(
  shop: FrameLocator,
  data: RegistrationData,
) {
  const form = shop.locator("#customer-form");

  await form.locator('input[name="firstname"]').fill(data.firstName);

  await form.locator('input[name="lastname"]').fill(data.lastName);

  await form.locator('input[name="email"]').fill(data.email);

  await form.locator('input[name="password"]').fill(data.password);
}

export async function acceptRequiredConsents(shop: FrameLocator) {
  const form = shop.locator("#customer-form");

  await form.locator('input[name="psgdpr"]').check();

  await form.locator('input[name="customer_privacy"]').check();
}

export async function submitRegistration(shop: FrameLocator) {
  await shop
    .locator('#customer-form [data-link-action="save-customer"]')
    .click();
}
