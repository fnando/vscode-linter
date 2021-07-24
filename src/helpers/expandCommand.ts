import * as vscode from "vscode";
import { isArray } from "lodash";
import * as path from "path";
import * as fs from "fs";
import { LinterConfig } from "vscode-linter-api";
import { findGemfile } from "./findGemfile";
import { debug } from "./debug";

type Args = { [key: string]: unknown };

const extraArgs: {
  [key: string]: (args: Args) => boolean;
} = {
  $isRails: (args): boolean => {
    const gemfile = findGemfile(args["$rootDir"] as string);

    return Boolean(
      gemfile &&
        fs
          .readFileSync(gemfile)
          .toString()
          .match(/^gem ("rails"|'rails')/gm),
    );
  },

  $isBundler: (args): boolean => {
    return Boolean(findGemfile(args["$rootDir"] as string));
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

  // Expand arguments from command that are computable (e.g. $isBundler).
  linterConfig.command.forEach((item) => {
    const name = [item].flat()[0];

    if (name in extraArgs && !(name in args)) {
      args[name] = extraArgs[name]?.call(null, args);
    }
  });

  // Expand arguments from `when` that are computable (e.g. $isRails).
  (linterConfig.when ?? []).forEach((name) => {
    args[name] = extraArgs[name]?.call(null, args);
  });

  // Generate negated version for all variables.
  Object.keys(args).forEach((name) => {
    args[`!${name}`] = !Boolean(args[name]);
  });

  return args;
}

export function expandCommand(
  linterConfig: LinterConfig,
  args: { [key: string]: unknown },
) {
  args = expandArgs(linterConfig, args);

  const when = linterConfig.when?.reduce(
    (buffer, name) => Boolean(buffer && args[name]),
    true,
  );

  if (linterConfig.when?.length > 0 && !when) {
    debug(
      "skipping",
      linterConfig.name,
      "because `when` is not satisfied",
      linterConfig.when,
    );
    return [];
  }

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
