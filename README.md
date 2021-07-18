<p align="center">
  <a href="https://gitthub.com/fnando/vscode-linter/">
    <img width="128" height="128" src="https://github.com/fnando/vscode-linter/raw/main/icon.png" alt="Linter">
  </a>
  <br>
  Extension for code linting, all in one package.
</p>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=fnando.linter">
    <img src="https://img.shields.io/visual-studio-marketplace/i/fnando.linter" alt="VSCode Marketplace Installs">
  </a>
  <a href="https://marketplace.visualstudio.com/items?itemName=fnando.linter">
    <img src="https://img.shields.io/visual-studio-marketplace/v/fnando.linter?color=blue" alt="Linter Version">
  </a>
</p>

![Linter in Action](https://github.com/fnando/vscode-linter/raw/main/linter.png)

Extension for code linting, all in one package. New linters can be easily added
through an extension framework.

Supports out of the box:

- [Brakeman](https://brakemanscanner.org)
- [Credo](https://hexdocs.pm/credo/overview.html)
- [Dart](https://dart.dev/tools/linter-rules)
- [ESLint](https://eslint.org)
- [hadolint (Dockerfile)](https://github.com/hadolint/hadolint)
- [LanguageTool](https://github.com/hadolint/hadolint)
- [Luacheck](https://luacheck.readthedocs.io/en/stable/)
- [markdownlint](https://github.com/DavidAnson/markdownlint)
- [PHP CodeSniffer](https://github.com/squizlabs/PHP_CodeSniffer)
- [proselint](https://github.com/amperser/proselint/)
- [pylint](https://www.pylint.org)
- [Reek](https://github.com/troessner/reek)
- [RuboCop](https://rubocop.org)
- [Ruby](https://www.ruby-lang.org)
- [shellcheck](https://github.com/koalaman/shellcheck)
- [sqlfluff](https://docs.sqlfluff.com/en/stable/index.html)
- [stylelint](https://stylelint.io)
- [swiftlint](https://realm.github.io/SwiftLint/)
- [textlint](https://textlint.github.io)
- [Vale](https://github.com/errata-ai/vale)
- [yamllint](https://github.com/adrienverge/yamllint)

Features:

- Implement new linters easily with just a few lines of code.
- Ignore rules (end-of line, file, or current line).
- Fix files (depends on linter's support).
- Add links to rule's documentation.
- Linters are lazy loaded, so you won't waste computer memory with linters you
  don't use.

## Usage

Install the extension by visiting
<https://marketplace.visualstudio.com/items?itemName=fnando.linter> or searching
for `fnando.linter`.

Linter will use the binary that's on your `$PATH`; if your file is not being
linted, check the "linter" output panel for additional information.

![Output panel](https://github.com/fnando/vscode-linter/raw/main/docs/images/output.png)

You can tweak your linters configuration by editing only the nodes you need; for
instance, to disable a linter, all you need is something like this:

```json
{
  "linter.linters": {
    "ruby": {
      "enabled": false
    }
  }
}
```

## Development

- [Create your own linter extension](https://github.com/fnando/vscode-linter/tree/main/docs/creating-linters.md)

## License

Copyright © 2021 Nando Vieira

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
