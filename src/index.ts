import * as sh from "@actions/exec";
import * as github from "@actions/github";
import * as core from "@actions/core";
import * as Webhooks from "@octokit/webhooks";

const context = github.context;

async function run() {
  try {
    if (context.eventName !== "pull_request") {
      core.setOutput("skip", true);
      core.info("Not a pull request, skipping");
      return;
    }

    const payload = context.payload as Webhooks.EventPayloads.WebhookPayloadPullRequest;

    switch (payload.action) {
      case "synchronize":
        break;

      default:
        core.setOutput("skip", true);
        core.info(`Pull request action ${payload.action} is ignored`);
        return;
    }

    const pr = payload.number;
    const sha = payload.pull_request.head.sha.substr(-7);

    let access = core.getInput("access");
    switch (access) {
      case "public":
        break;
      default:
        access = "restricted";
        break;
    }

    // Update the version number in package.json with beta.<sha>
    let version = "";
    await sh.exec(
      "npm",
      ["version", "prerelease", `--preid=beta.${sha}`, "--no-git-tag-version"],
      {
        listeners: {
          stdline: (data: string) => {
            version = data.trim();
          },
        },
      }
    );

    core.info(`Publishing package from PR #${pr} with version ${version}`);

    // Publish under the PR tag
    await sh.exec("npm", ["publish", "--access", access, "--tag", `pr${pr}`]);
  } catch (err) {
    core.setFailed(err.message);
  }
}

run();
