import * as sh from "@actions/exec";
import * as github from "@actions/github";
import * as core from "@actions/core";
import * as fs from "fs";

const context = github.context;

async function run() {
  try {
    if (context.eventName !== "pull_request") {
      core.setOutput("skip", true);
      core.info("Not a pull request, skipping");
      return;
    }

    const payload = context.payload;

    switch (payload.action) {
      case "synchronize":
      case "opened":
        break;

      default:
        core.setOutput("skip", true);
        core.info(`Pull request action ${payload.action} is ignored`);
        return;
    }

    const pr = payload.number;
    const sha = payload.pull_request!.head.sha.substr(0, 7);

    let access = core.getInput("access");
    switch (access) {
      case "public":
        break;
      default:
        access = "restricted";
        break;
    }

    const path = core.getInput("path") || ".";

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
        cwd: path,
      }
    );

    core.info(
      `Publishing package from PR #${pr} with version ${version}, access: ${access}`
    );

    // Publish under the PR tag
    await sh.exec("npm", ["publish", "--access", access, "--tag", `pr${pr}`], {
      cwd: path,
    });

    // Post PR comment with tag
    const token = process.env.GITHUB_TOKEN as string;
    if (token) {
      const client = github.getOctokit(token);
      const owner = github.context.repo.owner;
      const repo = github.context.repo.repo;

      const packageJson = fs.readFileSync("./package.json", "utf8");
      const packageJsonObj = JSON.parse(packageJson);
      const packageName = packageJsonObj.name;

      const response = await client.rest.issues.createComment({
        owner,
        repo,
        issue_number: pr,
        body: `npm package published as ${packageName}@${version.substring(1)}`,
      });
      core.debug(`created comment URL: ${response.data.html_url}`);
    }
  } catch (err: any) {
    core.setFailed(err.message);
  }
}

run();
