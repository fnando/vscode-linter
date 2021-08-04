# Change Log

All notable changes to the "linter" extension will be documented in this file.

## 0.0.11

- Add option to disable cached results.

## 0.0.10

- Fix swiftlint's ignore line pragma.
- Render diagnostics as they are ready, instead of waiting for every linter to
  be done.

## 0.0.9

- ESLint will run only against JavaScript and TypeScript files.

## 0.0.8

- Fix eslint config files list.

## 0.0.7

- Remove `console.log`.

## 0.0.6

- Add variables
  - `$isRails`: when current project has Gemfile that lists Rails as dependency.
  - `$isBundler`: when curren project has Gemfile.
  - `$extensionBare`: the file's extension without the dot. E.g. `md`.
- Prefix `rubocop` and `brakeman` with Bundler when running from a directory
  that contains a Gemfile.
- Improve debug output to include stdout/stderr when a linter raises an
  exception.

## 0.0.5

- Add dart.

## 0.0.4

- Add credo.

## 0.0.3

- Add luacheck.

## 0.0.2

- Add Brakeman.
- Cache linting results, and display it as soon as possible.
- Add support for inline fix.

## 0.0.1

- Fix swiftlint's ignore file pragma.
- Fix conditions for ignore code actions.
- Add proselint.
- Add vale.
- Add LanguageTool.

## 0.0.0

- Initial release.
