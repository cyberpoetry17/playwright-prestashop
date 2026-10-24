# playwright-prestashop

Playwright end-to-end tests for the PrestaShop demo customer registration functionality.

## Installation

Install project dependencies:

```bash
npm i
```

## Run tests

Run all Playwright tests:

```bash
npx playwright test
```

Run tests in headed mode:

```bash
npx playwright test --headed
```

Open the Playwright HTML report:

```bash
npx playwright show-report
```

## Test coverage

The test suite covers customer registration through two available user flows:

- Registration through the **Sign in** page
- Registration through the **footer Create an account** link

The registration tests include:

- Successful registration with valid mandatory data
- Registration request and submitted data validation
- Invalid email address
- Invalid first name values
- Password minimum and maximum length
- Password strength validation
- Required consent validation
- Duplicate email registration
- Empty mandatory fields

## Project structure

```text
tests/
├── helpers/
│   ├── customers.json
│   └── registration-helpers.ts
│
└── registration.spec.ts
```

- `customers.json` contains reusable customer test data.
- `registration-helpers.ts` contains reusable registration actions and locators.
- `registration.spec.ts` contains the Playwright registration test scenarios.

## Test environment

Tests run against the public PrestaShop demo:

```text
https://demo.prestashop.com/#/en/front
```
