import * as vscode from "vscode";

const output: vscode.OutputChannel =
  vscode.window.createOutputChannel("linter");

export function log(...args: any[]) {
  args = args.map((item) => {
    if (item instanceof Error) {
      return JSON.stringify(
        {
          name: item.name,
          message: item.message,
          stack: item.stack?.split("\n").map((entry) => entry.trim()),
        },
        null,
        2,
      );
    }

    if (["boolean", "string", "number"].includes(typeof item)) {
      return item.toString();
    }

    if (item === null) {
      return "null";
    }

    if (item === undefined) {
      return "undefined";
    }

    return JSON.stringify(item, null, 2);
  });

  output.appendLine(args.join(" "));
}

export function debug(...args: any) {
  log(`\n[${new Date().toLocaleString()}]`, ...args);
}
