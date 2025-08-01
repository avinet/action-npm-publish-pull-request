# action-npm-publish-pull-request

Publishes an npm pre-release package for pull requests.

Usage:

```yaml
- name: Publish pre-release package (PRs only)
  uses: avinet/action-npm-publish-pull-request@v6
  with:
    access: restricted # Or 'public', defaults to 'restricted
    path: . # Path to run npm publish in. Defaults to . (root directory)
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

If `GITHUB_TOKEN` is set, a comment with the newly created package version will
be posted in the PR. The automatically provided secret `GITHUB_TOKEN` can be
used here.

`NODE_AUTH_TOKEN` is required for publishing to the npm package registry. It can
be set to the provided `GITHUB_TOKEN` to publish to its own repo package.
