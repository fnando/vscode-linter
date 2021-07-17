# Creating Linters

A function is just a regular VSCode extension that exports a few functions. It's
never really activated by VSCode; instead, it's loaded by `fnando.linter`, the
main extension.

A linter extension is made of a few things:

- A VSCode configuration in a specific format.
- 1 required function that returns all the offenses for a given file.
- 1-3 optional functions that allows fixing the code.
- A package.json file that has `{"extensionDependencies": ["fnando.linter"]}`.

## Generating the skeleton of your extension

Make sure you have Node.js and Git installed, then install Yeoman and VSCode
Extension Generator with:

```console
$ npm install -g yo generator-code
```

In this example we're going to create an extension for
[eslint](https://eslint.org). You're extension must be named following the
`linter-%{linterName}` pattern; in our case, that would be `linter-eslint`.

Run `yo code` and follow the instructions. It's recommended that you use
TypeScript and Webpack.

```console
$ yo code

     _-----_     ╭──────────────────────────╮
    |       |    │   Welcome to the Visual  │
    |--(o)--|    │   Studio Code Extension  │
   `---------´   │        generator!        │
    ( _´U`_ )    ╰──────────────────────────╯
    /___A___\   /
     |  ~  |
   __'.___.'__
 ´   `  |° ´ Y `

? What type of extension do you want to create? New Extension (TypeScript)
? What's the name of your extension? linter-eslint
? What's the identifier of your extension? linter-eslint
? What's the description of your extension? ESLint extension for https://github.com/fnando/vsco
de-linter
? Initialize a git repository? Yes
? Bundle the source code with webpack? Yes
? Which package manager to use? npm

Writing in /Users/fnando/Projects/personal/linter-eslint...
   create linter-eslint/.vscode/extensions.json
   create linter-eslint/.vscode/launch.json
   create linter-eslint/.vscode/settings.json
   create linter-eslint/.vscode/tasks.json
   create linter-eslint/src/test/runTest.ts
   create linter-eslint/src/test/suite/extension.test.ts
   create linter-eslint/src/test/suite/index.ts
   create linter-eslint/.vscodeignore
   create linter-eslint/.gitignore
   create linter-eslint/README.md
   create linter-eslint/CHANGELOG.md
   create linter-eslint/vsc-extension-quickstart.md
   create linter-eslint/tsconfig.json
   create linter-eslint/src/extension.ts
   create linter-eslint/package.json
   create linter-eslint/.eslintrc.json
   create linter-eslint/webpack.config.js
```

Once you're done, you need to add the package
[vscode-linter-api](https://github.com/fnando/vscode-linter-api) as your
development dependency.

```console
$ npm i --save-dev https://github.com/fnando/vscode-linter-api.git
```

## Defining the extension configuration

The first thing you need to add is the dependency on the main linter extension,
which is responsible for managing the execution and how it displays the
offenses.

Open your extension's `package.json` and add the following:

```diff
diff --git a/package.json b/package.json
index 9f7db6c..c582b7a 100644
--- a/package.json
+++ b/package.json
@@ -1,17 +1,57 @@
 {
-  "activationEvents": [
-    "onCommand:linter-eslint.helloWorld"
-  ],
+  "activationEvents": [],
   "categories": [
-    "Other"
+    "Linters"
   ],
   "contributes": {
-    "commands": [
-      {
-        "command": "linter-eslint.helloWorld",
-        "title": "Hello World"
+    "configuration": {
+      "properties": {
+        "linter-eslint.config": {
+          "default": {
+            "capabilities": [],
+            "command": [
+              "eslint",
+              "--format",
+              "json",
+              "--no-ignore",
+              [
+                "$config",
+                "--config",
+                "$config"
+              ],
+              "--stdin-filename",
+              "$file",
+              "--stdin"
+            ],
+            "configFiles": [
+              ".prettierrc",
+              ".prettierrc.json",
+              ".prettierrc.yml",
+              ".prettierrc.yaml",
+              ".prettierrc.json5",
+              ".prettierrc.js",
+              ".prettierrc.cjs",
+              "prettier.config.js",
+              "prettier.config.cjs",
+              ".prettierrc.toml"
+            ],
+            "enabled": true,
+            "languages": [
+              "javascript",
+              "json",
+              "jsonc",
+              "jsx",
+              "typescript",
+              "typescriptreact"
+            ],
+            "name": "eslint",
+            "url": "https://eslint.org"
+          },
+          "title": "The ESLint linter configuration",
+          "type": "object"
+        }
       }
-    ]
+    }
   },
   "description": "ESLint extension for https://github.com/fnando/vscode-linter",
   "devDependencies": {
@@ -26,6 +66,7 @@
     "mocha": "^8.4.0",
     "ts-loader": "^9.2.2",
     "typescript": "^4.3.2",
+    "vscode-linter-api": "github:fnando/vscode-linter-api",
     "vscode-test": "^1.5.2",
     "webpack": "^5.38.1",
     "webpack-cli": "^4.7.0"
@@ -34,6 +75,9 @@
   "engines": {
     "vscode": "^1.57.0"
   },
+  "extensionDependencies": [
+    "fnando.linter"
+  ],
   "main": "./dist/extension.js",
   "name": "linter-eslint",
   "scripts": {
```

There's quite a lot of changes, but the only one that requires explanation is
the command. The command will receive the file's content that will be linted via
STDIN. Notice that there are some strings containing `$`; those indicates
variables. Linter will add a few variables (and you can define your own with
some rules), but this is how it works:

- If the entry is a string, then the value is just replaced. For instance,
  `$file` would be replaced with the full path of the file.
- If the entry is an array, then the first item will act as a condition; if the
  value is truthy, then the remaning items are processed and added to the final
  command list. Otherwise, the values will be ignored.

The built-in variables are:

- `$code`: the offense's code,
- `$config`: the configuration file that will be used.
- `$debug`: whether debug mode is enabled or not.
- `$extension`: the file's extension, in lowercase.
- `$file`: the full file path.
- `$fixAll`: `true` when trying to fix the whole file.
- `$fixCategory`: `true` when trying to fix one whole category.
- `$fixOne`: `true` when trying to fix one offense.
- `$language`: the document's language id.
- `$lint`: whether the command that will be executed is for linting.

All variables will also have a falsy counterpart. For instance, if you want to
add some configuration when no config file is set, then you can use something
like `["!$config", "--config", "/default/config/file"]`;

## Defining the list of offenses

Before we go any further, we need to understand how linters are executed. ESLint
supports STDIN, so we don't need to create a wrapper. This makes everything
easier, and we can even test how everything works in the command-line.

```console
$ echo "var a = 1" | eslint --rule '{semi: "error"}' --format json --stdin \
  --no-eslintrc --no-ignore --stdin-filename foo.js
[
  {
    "filePath": "/Users/fnando/Projects/personal/linter-eslint/foo.js",
    "messages": [
      {
        "ruleId": "semi",
        "severity": 2,
        "message": "Missing semicolon.",
        "line": 1,
        "column": 10,
        "nodeType": "VariableDeclaration",
        "messageId": "missingSemi",
        "endLine": 2,
        "endColumn": 1,
        "fix": {
          "range": [
            9,
            9
          ],
          "text": ";"
        }
      }
    ],
    "errorCount": 1,
    "warningCount": 0,
    "fixableErrorCount": 1,
    "fixableWarningCount": 0,
    "source": "var a = 1\n",
    "usedDeprecatedRules": []
  }
]
```

This is the output you'll receive on your `getOffenses()` function, which is
responsible for parsing this code and returning a list of offenses. Ideally, you
need to run the same command your extension will run, but in this case I had
some global configuration on my configuration that'd return a different output
if you didn't have the same extensions installed.

Let's create this function. First, remove all the content from
"src/extension.ts", as we only need to export some functions that will be
executed by Linter.

Start by importing the types.

```ts
import {
  LinterGetOffensesFunction,
  LinterOffense,
  LinterOffenseSeverity,
} from "vscode-linter-api";
```

Now, export the function `getOffenses()`.

```ts
import {
  LinterGetOffensesFunction,
  LinterOffense,
  LinterOffenseSeverity,
} from "vscode-linter-api";

export const getOffenses: LinterGetOffensesFunction = () => [];
```

This alone would be enough to make your extension "work" (in the sense that it
wouldn't raise an exception). Let's transform the stdout into a JavaScript
representation.

```ts
import {
  LinterGetOffensesFunction,
  LinterOffense,
  LinterOffenseSeverity,
} from "vscode-linter-api";

export interface ESLintOffense {
  messages: {
    ruleId: string;
    severity: number;
    message: string;
    line: number;
    column: number;
    endLine: number;
    endColumn: number;
    fix: unknown;
  }[];
}

export const getOffenses: LinterGetOffensesFunction = ({ stdout }) => {
  const payload: ESLintOffense[] = JSON.parse(stdout);

  return [];
};
```

As you can see above, we don't need to type everything out of the JSON payload;
instead, let's focus on just what we need. Finally, you must convert the ESLint
offense into something the Linter understands; this is represented by
`LinterOffense`.

```ts
import {
  LinterGetOffensesFunction,
  LinterOffenseSeverity,
} from "vscode-linter-api";

export interface ESLintOffense {
  messages: {
    ruleId: string;
    severity: number;
    message: string;
    line: number;
    column: number;
    endLine: number;
    endColumn: number;
    fix: unknown;
  }[];
}

const offenseSeverity: { [key: string]: LinterOffenseSeverity } = {
  1: LinterOffenseSeverity.warning,
  2: LinterOffenseSeverity.error,
};

export const getOffenses: LinterGetOffensesFunction = ({ uri, stdout }) => {
  const payload: ESLintOffense[] = JSON.parse(stdout);

  return payload[0].messages.map((offense) => {
    const lineStart = offense.line - 1;
    const columnStart = offense.column - 1;

    // Line/column end are optional.
    const lineEnd = (offense.endLine ?? offense.line) - 1;
    const columnEnd = (offense.endColumn ?? offense.column) - 1;

    return {
      uri,
      lineStart,
      columnStart,
      lineEnd,
      columnEnd,
      code: offense.ruleId,
      message: offense.message,
      source: "eslint",
      correctable: Boolean(offense.fix),
      severity: offenseSeverity[offense.severity],
      docsUrl: getDocsUrl(offense.ruleId),
    };
  });
};
```

That's it! You can test your linter by going to "Run and Debug" and clicking
"Run Extension"; this will open a new window with your extension running. Create
a new JavaScript file (or another file that matches the language you defined on
your extension) and see if any errors will show up.

To help debug your extension, select "linter" under the Output panel. You should
see some basic info related to your linters:

![Output panel](https://github.com/fnando/vscode-linter/raw/main/docs/images/output.png)

One optional but extremely recommended property is `docsUrl`, which should link
to the offense's documentation. Due to the ESLint's plugin system, this can be
somewhat complicated, but let's add support for most popular plugins, falling
back to ESLint's default rules.

Add `docsUrl: getDocsUrl(offense.ruleId)` to your offense definition. Then
implement the function `getDocsUrl(code:string)`.

```diff
diff --git a/src/extension.ts b/src/extension.ts
index 36272e6..dd9d07d 100644
--- a/src/extension.ts
+++ b/src/extension.ts
@@ -35,5 +35,30 @@ export const getOffenses: LinterGetOffensesFunction = ({ uri, stdout }) => {
     source: "eslint",
     correctable: Boolean(offense.fix),
     severity: offenseSeverity[offense.severity],
+    docsUrl: getDocsUrl(offense.ruleId),
   }));
 };
+
+function getDocsUrl(code: string) {
+  if (!code) {
+    return undefined;
+  }
+
+  const [plugin, rule] = code.split("/");
+
+  const urls: { [key: string]: string } = {
+    "@typescript-eslint": `https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/${rule}.md`,
+    react: `https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/${rule}.md`,
+    "jsx-a11y": `https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/blob/master/docs/rules/${rule}.md`,
+    jest: `https://github.com/jest-community/eslint-plugin-jest/blob/HEAD/docs/rules/${rule}.md`,
+    import: `https://github.com/benmosher/eslint-plugin-import/blob/HEAD/docs/rules/${rule}.md`,
+    unicorn: `https://github.com/sindresorhus/eslint-plugin-unicorn/blob/HEAD/docs/rules/${rule}.md`,
+    lodash: `https://github.com/wix/eslint-plugin-lodash/blob/HEAD/docs/rules/${rule}.md`,
+  };
+
+  if (rule) {
+    return urls[plugin];
+  }
+
+  return `https://eslint.org/docs/rules/${plugin}`;
+}
```

This will be displayed on each offense, as you can see in the image below.

![Rule documentation on context menu](https://github.com/fnando/vscode-linter/raw/main/docs/images/rule-documentation.png)

## Adding code actions

VSCode's Code Actions allows to add some functionally to diagnostics (the items
that show up under the Problems tab). Linter abstracts all the logic behind it,
so all you need to do is changing the "capabilities" list of your extension's
configuration and defining some functions.

First, let's add an option to fix your file. ESLint doesn't have an easy way to
fix individual items through the command-line, but other extensions will
manipulate the contents of your document manually to make it happen (ESLint do
exposes the changes that need to be performed though).

To fix all offenses that can be fixed, we need to run ESLint with the option
`--fix-dry-run`, because we're using STDIN. This must be performed
conditionally, using the `$fixAll` variable.

```diff
diff --git a/package.json b/package.json
index c582b7a..dc63d9d 100644
--- a/package.json
+++ b/package.json
@@ -8,12 +8,18 @@
       "properties": {
         "linter-eslint.config": {
           "default": {
-            "capabilities": [],
+            "capabilities": [
+              "fix-all"
+            ],
             "command": [
               "eslint",
               "--format",
               "json",
               "--no-ignore",
+              [
+                "$fixAll",
+                "--fix-dry-run"
+              ],
               [
                 "$config",
                 "--config",
```

With this change, VSCode will display the option to fix the whole document, but
it won't be functional until we add the function that parses the output.

![Diagnostic with fix all eslint rules on this file option](https://github.com/fnando/vscode-linter/raw/main/docs/images/offense-with-fix-all-action.png)

To make it work, we need to add a new function called `parseFixOutput(params)`.

```diff
commit 83608e1bae35e7291ee3f46493c9269363e62b73
Author: Nando Vieira <me@fnando.com>
Date:   Mon Jul 5 15:26:58 2021 -0700

    Add function to parse fix output.

diff --git a/src/extension.ts b/src/extension.ts
index e8662be..6153772 100644
--- a/src/extension.ts
+++ b/src/extension.ts
@@ -1,6 +1,7 @@
 import {
   LinterGetOffensesFunction,
   LinterOffenseSeverity,
+  LinterParseFixOutputFunction,
 } from "vscode-linter-api";

 export interface ESLintOffense {
@@ -71,3 +72,12 @@ function getDocsUrl(code: string) {

   return `https://eslint.org/docs/rules/${plugin}`;
 }
+
+export const parseFixOutput: LinterParseFixOutputFunction = ({
+  input,
+  stdout,
+}) => {
+  const payload = JSON.parse(stdout)[0];
+
+  return payload.output ?? input;
+};
```

Notice that we're parsing the stdout as a JSON payload; this happens because
we're running ESLint with `--format json` (as per our package.json
configuration). Another thing to pay attention is that `payload.output` may not
be defined; this happens when there are fixable offenses, so we reuse the
input's source code instead.

### Adding a code action to ignore offenses

Let's add another code action, now to ignore a current offense. This action will
required a function called `getIgnoreLinePragma(params)`. The logic of this
function will change from linter to linter and can't be fully abstracted by
Linter. This is how ESLint behaves:

- To ignore all offenses on the next line, you use `// eslint-ignore-next-line`.
- You can specify the rules you want to disable, with
  `//eslint-ignore-next-line rule1, rule2, ruleN`.

Linter allows ignoring offenses in three different types:

- `ignore-line`: adds a pragma instruction to ignore the current line by adding
  the directive to the previous line (like the description above).
- `ignore-eol`: adds a pragma instruction to the end of the current line.
- `ignore-file`: adds a pragma instruction to top of the file, usually to
  disable the rule for the whole file.

With ESLint, we can easily implement `ignore-file` and `ignore-line`. Some
linters may also support `ignore-eol`; that's the case of Rubocop, a Ruby
linter.

First, let's add the capabilities to our extension's configuration.

```diff
diff --git a/package.json b/package.json
index dc63d9d..276a1d3 100644
--- a/package.json
+++ b/package.json
@@ -9,7 +9,9 @@
         "linter-eslint.config": {
           "default": {
             "capabilities": [
-              "fix-all"
+              "fix-all",
+              "ignore-line",
+              "ignore-file"
             ],
             "command": [
               "eslint",
```

If you run the extension, you'll see that each diagnostic now displays the
option to ignore the line or add

These capabilities require your linter to implement the functions
`getIgnoreLinePragma(params)` and `getIgnoreFilePragma(params)`.

First, let's implement `getIgnoreLinePragma(params)`. The idea is kinda simple:
if the pragma already exists, we replace it including the new rule, otherwise we
return the line plus pragma (or vice-versa), depending on which line we are.

```diff
diff --git a/src/extension.ts b/src/extension.ts
index 6153772..679c705 100644
--- a/src/extension.ts
+++ b/src/extension.ts
@@ -1,4 +1,5 @@
 import {
+  LinterGetIgnoreLinePragmaFunction,
   LinterGetOffensesFunction,
   LinterOffenseSeverity,
   LinterParseFixOutputFunction,
@@ -81,3 +82,51 @@ export const parseFixOutput: LinterParseFixOutputFunction = ({

   return payload.output ?? input;
 };
+
+export const getIgnoreLinePragma: LinterGetIgnoreLinePragmaFunction = ({
+  line,
+  indent,
+  code,
+}) => {
+  const matches = line.text.match(
+    /^\s*\/\/\s*eslint-disable-next-line(?:\s+(.+))?$/,
+  );
+
+  let existingCodes = [code];
+
+  if (matches && matches[1]) {
+    existingCodes.push(...matches[1].split(","));
+  }
+
+  // Ensure we keep unique codes. You could add a 3rd party dependency like
+  // lodash, or you can do it yourself.
+  existingCodes = existingCodes.reduce((buffer, item) => {
+    item = item.trim();
+
+    if (!buffer.includes(item)) {
+      buffer.push(item);
+    }
+
+    return buffer;
+  }, [] as string[]);
+
+  existingCodes.sort();
+
+  const pragma = `${indent}// eslint-disable-next-line ${existingCodes.join(
+    ", ",
+  )}`;
+
+  // If we already have a pragma line,
+  // we just need to replace the existing one.
+  if (matches) {
+    return pragma;
+  }
+
+  // If we're are the first line of the file,
+  // then the order is [pragma, line].
+  if (line.number === 0) {
+    return [pragma, line.text].join("\n");
+  }
+
+  return [line.text, pragma].join("\n");
+};
```

The main use cases you need to test are:

- Ignoring an offense that lives on line 1.
- Ignoring multiple offenses from the same line.
- Ignoring an offense from lines 2+.

And now, to `getIgnoreFilePragma(params)`. The idea is pretty much the same.

```diff
diff --git a/src/extension.ts b/src/extension.ts
index 679c705..4b53a4a 100644
--- a/src/extension.ts
+++ b/src/extension.ts
@@ -1,5 +1,6 @@
 import {
   LinterGetIgnoreLinePragmaFunction,
+  LinterGetIgnoreFilePragmaFunction,
   LinterGetOffensesFunction,
   LinterOffenseSeverity,
   LinterParseFixOutputFunction,
@@ -130,3 +131,42 @@ export const getIgnoreLinePragma: LinterGetIgnoreLinePragmaFunction = ({

   return [line.text, pragma].join("\n");
 };
+
+export const getIgnoreFilePragma: LinterGetIgnoreFilePragmaFunction = ({
+  line,
+  code,
+}) => {
+  const matches = line.text.match(
+    /^\s*\/\*\s*eslint-disable(?:\s+(.+))?\s*\*\/$/,
+  );
+
+  let existingCodes = [code];
+
+  if (matches && matches[1]) {
+    existingCodes.push(...matches[1].split(","));
+  }
+
+  // Ensure we keep unique codes. You could add a 3rd party dependency like
+  // lodash, or you can do it yourself.
+  existingCodes = existingCodes.reduce((buffer, item) => {
+    item = item.trim();
+
+    if (!buffer.includes(item)) {
+      buffer.push(item);
+    }
+
+    return buffer;
+  }, [] as string[]);
+
+  existingCodes.sort();
+
+  const pragma = `/* eslint-disable ${existingCodes.join(", ")} */`;
+
+  // If we already have a pragma line,
+  // we just need to replace the existing one.
+  if (matches) {
+    return pragma;
+  }
+
+  return [pragma, line.text].join("\n");
+};
```

### Adding code for inline fixes

Linter has support for inline fixes, meaning that if you set the offense's
`inlineFix` property, a code action to fix that offense will be displayed.

First, we need to indicate that our linter supports inline fix; this can be done
by adding the `fix-inline` capability.

```diff
diff --git a/package.json b/package.json
index 276a1d3..ce92741 100644
--- a/package.json
+++ b/package.json
@@ -10,6 +10,7 @@
           "default": {
             "capabilities": [
               "fix-all",
+              "fix-inline",
               "ignore-line",
               "ignore-file"
             ],
```

Now, we need to set the inline fix on the offense's object. This is what ESLint
returns as a offense with a fix:

```json
{
  "ruleId": "quotes",
  "severity": 2,
  "message": "Strings must use doublequote.",
  "line": 4,
  "column": 15,
  "nodeType": "Literal",
  "messageId": "wrongQuotes",
  "endLine": 4,
  "endColumn": 30,
  "fix": {
    "range": [36, 51],
    "text": "\"change quotes\""
  }
}
```

To make the inline fix work, all you have to do is changing the offense to
include the property `inlineFix` with this info:

```diff
diff --git a/src/extension.ts b/src/extension.ts
index 4b53a4a..6386dff 100644
--- a/src/extension.ts
+++ b/src/extension.ts
@@ -4,6 +4,7 @@ import {
   LinterGetOffensesFunction,
   LinterOffenseSeverity,
   LinterParseFixOutputFunction,
+  LinterOffense,
 } from "vscode-linter-api";

 export interface ESLintOffense {
@@ -15,7 +16,10 @@ export interface ESLintOffense {
     column: number;
     endLine: number;
     endColumn: number;
-    fix: unknown;
+    fix?: {
+      text: string;
+      range: [number, number];
+    };
   }[];
 }

@@ -35,7 +39,7 @@ export const getOffenses: LinterGetOffensesFunction = ({ uri, stdout }) => {
     const lineEnd = (offense.endLine ?? offense.line) - 1;
     const columnEnd = (offense.endColumn ?? offense.column) - 1;

-    return {
+    const linterOffense: LinterOffense = {
       uri,
       lineStart,
       columnStart,
@@ -48,6 +52,15 @@ export const getOffenses: LinterGetOffensesFunction = ({ uri, stdout }) => {
       severity: offenseSeverity[offense.severity],
       docsUrl: getDocsUrl(offense.ruleId),
     };
+
+    if (offense.fix) {
+      linterOffense.inlineFix = {
+        replacement: offense.fix.text,
+        offset: offense.fix.range,
+      };
+    }
+
+    return linterOffense;
   });
 };
```

Notice that we're using the `offset` provided by ESLint. If your linter returns
columns instead, then you can use the following signature:

```ts
linterOffense.inlineFix = {
  replacement: "some text",
  start: { line: 0, column: 0 },
  end: { line: 0, column: 80 },
};
```

And this pretty much covers the implementation of a linter. If your linter
supports end-of-line pragma instructions like Rubocop, then the logic is the
same; parse the list of current rules being ignored (if any) and append the new
one.

This what you'll see on VSCode:

![ESLint running with Linter](https://github.com/fnando/vscode-linter/raw/main/docs/images/eslint-linter-in-action.png)

The next step is
[packaging and publishing your extension](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
to the Marketplace. If you need an icon, we have a [Sketch](https://sketch.com)
file available at
<https://github.com/fnando/vscode-linter/raw/main/icon-linter.sketch>. Don't
have Sketch or don't use Mac?
[Make a request](https://github.com/fnando/vscode-linter/issues/new) and one
will be exported for you.

If you have any questions,
[ask it away](https://github.com/fnando/vscode-linter/discussions/categories/q-a)!
