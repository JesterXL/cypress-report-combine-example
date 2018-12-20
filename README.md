# Cypress Report Combine Example

The end to end test tool [Cypress.io](https://www.cypress.io/) is life changing in a positive way.

## Problem: Each File Generates a New Report

... however, if you create multiple tests, it runs them in isolation for concurrency reasons. This means if you create reports, you'll get a new report generated from [Mocha](https://mochajs.org/) for each cypress spec file that runs. In something like [Protractor](https://www.protractortest.org/#/), you can simply have [Jasmine](https://jasmine.github.io/) generate a combined report from multiple spec files via a configuration of `resultJsonOutputFile: 'report.json'`.

## Solution

I whipped up some quick code in this repo to generate a unique report for each file, then combine them once complete. While not a library you can install, the code should be helpful to guide you, or even re-use, in any endeavor you have to combine multiple reports.

## Use Case

At my job, part of our end to end tests are supposed to generate a report indicating which feature tests passed, how long they took, and put these into a single JSON file for audit record keeping. For our Selenium tests in Protractor, you just do that config I mentioned above, and you're done.

In Cypress, I didn't know that each test had it's own report. That won't do as all the tests are testing the same app, and we need those reports combined. Mocha or Cypress don't appear to expose a "the entire suite is done" type of [event](https://github.com/mochajs/mocha/wiki/Third-party-reporters).

So, I have each test output a uniquely named report, then read all of those, combine them, generate a single report, then delete the interim ones.

# How To Run?

To test yourself, download the code, `cd` to the directory and:

1. run `yarn install`
2. run `npm run start` (this'll launch Create React App site, it takes a few seconds)
3. in a separate terminal, run `npm run cypress-headless` (this'll run Cypress in headless mode which will hit your local React website)

You should see a reports folder be created, and in there you'll see the combined report. If you look fast enough, you'll even see the interim reports be created before they're deleted.

# Where's the Goods?

Check out the `reporters` folder in the source. The `json-reporter.js` is your standard Mocha reporter. However, the `combine-reports.js` is where we write individual files, then combine them.