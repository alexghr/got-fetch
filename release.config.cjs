const { repository } = require("./package.json");
module.exports = {
  "branches": ["main"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    "@semantic-release/npm",
    "@semantic-release/git"
  ],

  repositoryUrl: repository.url,
  tagFormat: "v${version}"
};
