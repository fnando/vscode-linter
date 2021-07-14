import * as vscode from "vscode";
import { isArray } from "lodash";
import * as path from "path";
import * as fs from "fs";
import { LinterConfig } from "vscode-linter-api";

type Args = { [key: string]: unknown };

const extraArgs: {
  [key: string]: (args: Args) => boolean;
} = {
  "$is-rails": (args): boolean => {
    const gemfile = [
      path.join(args["$rootDir"] as string, "Gemfile"),
      path.join(args["$rootDir"] as string, "Gemfile.rb"),
      path.join(args["$rootDir"] as string, "gems.rb"),
    ].find((entry) => fs.existsSync(entry));

    return Boolean(
      gemfile &&
        fs
          .readFileSync(gemfile)
          .toString()
          .match(/^gem ("rails"|'rails')/gm),
    );
  },
};

function expandArgs(linterConfig: LinterConfig, args: Args): Args {
  const additionalArgs = Object.keys(linterConfig.args ?? {}).reduce(
    (buffer, name) => {
      let value = true;
      const customArgs = (linterConfig.args ?? {})[name];

      if (customArgs.languages?.length) {
        value =
          value && customArgs.languages.includes(args.$language as string);
      }

      if (customArgs.extensions?.length) {
        value =
          value && customArgs.extensions.includes(args.$extension as string);
      }

      buffer[name] = value;

      return buffer;
    },
    {} as { [key: string]: boolean },
  );

  args = { ...args, ...additionalArgs };

  (linterConfig.when ?? []).forEach((name) => {
    args[name] = extraArgs[name]?.call(null, args);
  });

  return Object.keys(args).reduce(
    (buffer, key) =>
      Object.assign(buffer, { [`!${key}`]: !Boolean(buffer[key]) }),
    args,
  );
}

export function expandCommand(
  linterConfig: LinterConfig,
  args: { [key: string]: unknown },
) {
  args = expandArgs(linterConfig, args);

  const command = linterConfig.command
    .flatMap((entry: any) => {
      if (!isArray(entry)) {
        return args[entry] || entry;
      }

      // If no value is found with that key, it means we don't have an argument
      // or the config is disabled.
      if (!args[entry[0]]) {
        return;
      }

      return entry.slice(1).map((item) => args[item] ?? item);
    })
    .filter(Boolean)
    .map((entry: any) => `${entry}`);

  const shim = path.join(
    vscode.extensions.getExtension("fnando.linter")!.extensionPath,
    "shims",
    `${path.basename(command[0])}-shim`,
  );

  if (fs.existsSync(shim)) {
    command[0] = shim;
  }

  return command;
}
