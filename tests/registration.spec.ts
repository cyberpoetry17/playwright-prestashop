import { test, expect, FrameLocator } from "@playwright/test";

import customers from "./helpers/customers.json";

import {
  getRegistrationForm,
  fillRegistrationForm,
  acceptRequiredConsents,
  submitRegistration,
  openRegistrationForm,
  openRegistrationFormFromFooter,
  PRESTASHOP_DEMO_URL,
} from "./helpers/registration-helpers";

let shop: FrameLocator;

test.describe("Customer registration", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PRESTASHOP_DEMO_URL);

    await expect(page.locator("#loadingMessage")).toBeHidden();

    shop = page.frameLocator('iframe[title="Frame of demo shop"]');
  });

  test.describe("Registration through the sign in page", () => {
    test.beforeEach(async () => {
      await openRegistrationForm(shop);

      await expect(getRegistrationForm(shop)).toBeVisible();
    });

    test.describe("Valid registration", () => {
      test("Successfully registers a customer with valid mandatory data", async ({
        page,
      }) => {
        const customer = customers.validCustomer;

        const form = getRegistrationForm(shop);

        await fillRegistrationForm(form, customer);

        await acceptRequiredConsents(form);

        const registrationResponsePromise = page.waitForResponse(
          (response) =>
            response.request().method() === "POST" &&
            response.url().includes("/registration"),
        );

        await submitRegistration(form);

        const registrationResponse = await registrationResponsePromise;

        expect(registrationResponse.status()).toBe(302);

        const submittedData = registrationResponse
          .request()
          .postDataJSON() as Record<string, string>;

        expect(submittedData.firstname).toBe(customer.firstName);
        expect(submittedData.lastname).toBe(customer.lastName);
        expect(submittedData.email).toBe(customer.email);
        expect(submittedData.password).toBe(customer.password);
        expect(submittedData.psgdpr).toBe("1");
        expect(submittedData.customer_privacy).toBe("1");

        await expect(
          shop.getByRole("link", {
            name: /sign out/i,
          }),
        ).toBeVisible();

        await expect(
          shop.getByRole("button", {
            name: `${customer.firstName} ${customer.lastName}`,
          }),
        ).toBeVisible();
      });
    });

    test.describe("Invalid registration", () => {
      test("Prevents registration with an invalid email address", async () => {
        const customer = customers.invalidEmailCustomer;

        const form = getRegistrationForm(shop);

        const emailInput = form.locator('input[name="email"]');

        await fillRegistrationForm(form, customer);
        await acceptRequiredConsents(form);
        await submitRegistration(form);

        await expect(emailInput).toHaveJSProperty("validity.valid", false);
        await expect(form).toBeVisible();
      });

      test.describe("Invalid first name", () => {
        const invalidNameCases = [
          {
            name: "whitespace only",
            customer: customers.whitespaceNameCustomer,
          },
          {
            name: "numbers",
            customer: customers.nameWithNumbersCustomer,
          },
          {
            name: "invalid characters",
            customer: customers.invalidCharactersCustomer,
          },
        ];

        for (const { name, customer } of invalidNameCases) {
          test(`Prevents registration when first name contains ${name}`, async () => {
            const form = getRegistrationForm(shop);

            await fillRegistrationForm(form, customer);
            await acceptRequiredConsents(form);
            await submitRegistration(form);

            await expect(form).toBeVisible();

            await expect(
              shop.getByRole("link", {
                name: /sign out/i,
              }),
            ).not.toBeVisible();
          });
        }
      });

      test("Prevents registration when password is shorter than 8 characters", async () => {
        const customer = customers.shortPasswordCustomer;

        const form = getRegistrationForm(shop);

        const passwordInput = form.locator('input[name="password"]');

        await fillRegistrationForm(form, customer);
        await acceptRequiredConsents(form);
        await submitRegistration(form);

        await expect(passwordInput).toHaveJSProperty("validity.valid", false);
        await expect(form).toBeVisible();

        await expect(
          shop.getByRole("link", {
            name: /sign out/i,
          }),
        ).not.toBeVisible();
      });

      test("Prevents registration when password does not meet the required strength", async () => {
        const customer = customers.weakPasswordCustomer;

        const form = getRegistrationForm(shop);
        const passwordInput = form.locator('input[name="password"]');

        const strengthRequirement = form.locator(
          '[data-ps-ref="password-requirements-score"]',
        );

        await fillRegistrationForm(form, customer);
        await acceptRequiredConsents(form);

        await expect(passwordInput).toHaveJSProperty("validity.valid", false);
        await expect(strengthRequirement).toContainText(
          "The minimum score must be: Strong",
        );

        await submitRegistration(form);

        await expect(form).toBeVisible();

        await expect(
          shop.getByRole("link", {
            name: /sign out/i,
          }),
        ).not.toBeVisible();
      });

      test("Does not allow password longer than 72 characters", async () => {
        const form = getRegistrationForm(shop);

        const passwordInput = form.locator('input[name="password"]');

        const tooLongPassword = "Aa1!".repeat(18) + "B";

        expect(tooLongPassword).toHaveLength(73);

        await passwordInput.pressSequentially(tooLongPassword);

        await expect(passwordInput).toHaveValue(tooLongPassword.slice(0, 72));
      });

      test("Prevents registration when required consent is not accepted", async () => {
        const customer = customers.consentCustomer;

        const form = getRegistrationForm(shop);

        const termsCheckbox = form.locator('input[name="psgdpr"]');

        const privacyLabel = form.locator(
          'label[for="field-customer_privacy"]',
        );

        await fillRegistrationForm(form, customer);

        await expect(termsCheckbox).not.toBeChecked();

        await privacyLabel.click();

        await submitRegistration(form);

        await expect(termsCheckbox).not.toBeChecked();
        await expect(termsCheckbox).toHaveJSProperty("validity.valid", false);
        await expect(form).toBeVisible();

        await expect(
          shop.getByRole("link", {
            name: /sign out/i,
          }),
        ).not.toBeVisible();
      });

      test("Prevents registration when customer privacy consent is not accepted", async () => {
        const customer = customers.privacyConsentCustomer;

        const form = getRegistrationForm(shop);
        const privacyCheckbox = form.locator('input[name="customer_privacy"]');
        const termsLabel = form.locator('label[for="field-psgdpr"]');

        await fillRegistrationForm(form, customer);

        await expect(privacyCheckbox).not.toBeChecked();

        await termsLabel.click();

        await submitRegistration(form);

        await expect(privacyCheckbox).not.toBeChecked();
        await expect(privacyCheckbox).toHaveJSProperty("validity.valid", false);
        await expect(form).toBeVisible();

        await expect(
          shop.getByRole("link", {
            name: /sign out/i,
          }),
        ).not.toBeVisible();
      });

      test("Prevents registration with an already registered email address", async () => {
        const customer = customers.duplicateCustomer;

        let form = getRegistrationForm(shop);

        await fillRegistrationForm(form, customer);
        await acceptRequiredConsents(form);
        await submitRegistration(form);

        const signOutLink = shop.getByRole("link", {
          name: /sign out/i,
        });

        await expect(signOutLink).toBeVisible();

        await signOutLink.click();

        await openRegistrationForm(shop);

        form = getRegistrationForm(shop);

        await expect(form).toBeVisible();

        await fillRegistrationForm(form, customer);
        await acceptRequiredConsents(form);
        await submitRegistration(form);

        await expect(form).toBeVisible();

        const duplicateEmailAlert = shop.getByRole("alert");

        await expect(duplicateEmailAlert).toBeVisible();

        await expect(duplicateEmailAlert).toContainText(
          "The email is already used, please choose another one or sign in",
        );

        await expect(
          shop.getByRole("link", {
            name: /sign out/i,
          }),
        ).not.toBeVisible();
      });

      test.describe("Empty mandatory fields", () => {
        const mandatoryFieldCases = [
          {
            name: "first name",
            customer: customers.missingFirstNameCustomer,
            inputName: "firstname",
          },
          {
            name: "last name",
            customer: customers.missingLastNameCustomer,
            inputName: "lastname",
          },
          {
            name: "email",
            customer: customers.missingEmailCustomer,
            inputName: "email",
          },
          {
            name: "password",
            customer: customers.missingPasswordCustomer,
            inputName: "password",
          },
        ];

        for (const { name, customer, inputName } of mandatoryFieldCases) {
          test(`Prevents registration when ${name} is empty`, async () => {
            const form = getRegistrationForm(shop);

            const requiredInput = form.locator(`input[name="${inputName}"]`);

            await fillRegistrationForm(form, customer);

            await expect(requiredInput).toBeEmpty();

            await acceptRequiredConsents(form);
            await submitRegistration(form);

            await expect(requiredInput).toBeEmpty();

            await expect(requiredInput).toHaveJSProperty(
              "validity.valid",
              false,
            );

            await expect(form).toBeVisible();

            await expect(
              shop.getByRole("link", {
                name: /sign out/i,
              }),
            ).not.toBeVisible();
          });
        }
      });
    });
  });

  test.describe("Registration through the footer", () => {
    test("Successfully registers a customer through the footer", async () => {
      const customer = customers.footerRegistrationCustomer;

      await openRegistrationFormFromFooter(shop);

      const form = getRegistrationForm(shop);

      await expect(form).toBeVisible();

      await fillRegistrationForm(form, customer);
      await acceptRequiredConsents(form);
      await submitRegistration(form);

      await expect(
        shop.getByRole("link", {
          name: /sign out/i,
        }),
      ).toBeVisible();

      await expect(
        shop.getByRole("button", {
          name: `${customer.firstName} ${customer.lastName}`,
        }),
      ).toBeVisible();
    });
  });
});
