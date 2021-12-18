const { repository } = require("./package.json");
module.exports = {
  branches: [
    { name: "main" },
    { name: "next", channel: "next", prerelease: "next" },
  ],
  plugins: [
    [
      "@semantic-release/commit-analyzer",
      {
        preset: "angular",
        releaseRules: [{ type: "build", scope: "deps", release: "patch" }],
      },
    ],
    [
      "@semantic-release/release-notes-generator",
      {
        preset: "angular",
      },
    ],
    "@semantic-release/changelog",
    "@semantic-release/npm",
    "@semantic-release/git",
  ],

  repositoryUrl: repository.url,
  tagFormat: "v${version}",
};
