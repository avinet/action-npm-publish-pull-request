import * as sh from "@actions/exec";
import * as github from "@actions/github";
import * as core from "@actions/core";
import * as Webhooks from "@octokit/webhooks";

const context = github.context;

async function run() {
  try {
    if (context.eventName !== "pull_request") {
      core.setOutput("skip", true);
      console.log("Not a pull request, skipping");
      return;
    }

    const payload = context.payload as Webhooks.EventPayloads.WebhookPayloadPullRequest;

    switch (payload.action) {
      case "synchronize":
        break;

      default:
        core.setOutput("skip", true);
        console.log(`Pull request action ${payload.action} is ignored`);
        return;
    }

    const pr = payload.number;
    const sha = payload.pull_request.head.sha.substr(-7);

    console.log(
      `Publishing pre-release package for PR #${pr} with beta tag ${sha}`
    );

    let access = core.getInput("access");
    switch (access) {
      case "public":
        break;
      default:
        access = "restricted";
        break;
    }

    // Update the version number in package.json with beta.<sha>
    sh.exec("npm", ["version", "prerelease", `--preid=beta.${sha}`]);
    // Publish under the PR tag
    sh.exec("npm", ["publish", "--access", access, "--tag", `pr${pr}`]);
  } catch (err) {
    console.log(err);
    core.setFailed(err.message);
  }
}

run();
