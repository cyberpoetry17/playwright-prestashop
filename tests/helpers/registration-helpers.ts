import { FrameLocator, Locator } from "@playwright/test";

type Customer = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

export const PRESTASHOP_DEMO_URL = "https://demo.prestashop.com/#/en/front";

export const getRegistrationForm = (shop: FrameLocator): Locator => {
  return shop.locator("#customer-form");
};

export const fillRegistrationForm = async (
  form: Locator,
  customer: Customer,
) => {
  await form.locator('input[name="firstname"]').fill(customer.firstName);

  await form.locator('input[name="lastname"]').fill(customer.lastName);

  await form.locator('input[name="email"]').fill(customer.email);

  await form.locator('input[name="password"]').fill(customer.password);
};

export const acceptRequiredConsents = async (form: Locator) => {
  await form.locator('label[for="field-psgdpr"]').click();

  await form.locator('label[for="field-customer_privacy"]').click();
};

export const submitRegistration = async (form: Locator) => {
  await form.locator('[data-link-action="save-customer"]').click();
};

export const openRegistrationForm = async (shop: FrameLocator) => {
  await shop
    .locator('#_desktop_ps_customersignin a[aria-label="Sign in"]')
    .click();

  await shop.locator('[data-link-action="display-register-form"]').click();
};

export const openRegistrationFormFromFooter = async (shop: FrameLocator) => {
  await shop
    .locator("footer")
    .getByRole("link", {
      name: "Create an account",
      exact: true,
    })
    .click();
};
