#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { ExpenseTrackerStack } from "./expense-tracker-stack.js";

const app = new cdk.App();

// Reference the existing certificate from apppotato-cert stack
// The certificate covers *.apppotato.com
new ExpenseTrackerStack(app, "expense-tracker", {
  env: {
    account: "155305329201",
    region: "us-west-2",
  },
  crossRegionReferences: true,
});

app.synth();
