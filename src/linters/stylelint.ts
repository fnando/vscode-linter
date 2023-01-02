import { debug, log } from "../helpers/debug";
import {
  LinterGetOffensesFunction,
  LinterParseFixOutputFunction,
  LinterOffense,
  LinterOffenseSeverity,
} from "vscode-linter-api";

interface StylelintPayload {
  source: string;
  deprecations: any[];
  invalidOptionWarnings: any[];
  parseErrors: any[];
  errored: boolean;
  warnings: StylelintOffense[];
}

interface StylelintOffense {
  line: number;
  column: number;
  rule: string;
  severity: string;
  text: string;
}

const OFFENSE_SEVERITY: { [key: string]: LinterOffenseSeverity } = {
  1: LinterOffenseSeverity.warning,
  2: LinterOffenseSeverity.error,
};

export const getOffenses: LinterGetOffensesFunction = ({
  stdout,
  stderr,
  uri,
}) => {
  if (!stdout) {
    debug("stylelint: stdout was empty, but here's stderr:");
    log(stderr);

    return Promise.resolve([]);
  }

  let result: StylelintPayload[] = [];

  try {
    result = JSON.parse(stdout);
  } catch (error) {
    return Promise.resolve([]);
  }

  const offenses: LinterOffense[] = [];

  result[0].warnings.forEach((offense: StylelintOffense) => {
    const message = offense.text.replace(` (${offense.rule})`, "");

    offenses.push({
      uri,
      lineStart: Math.max(0, offense.line - 1),
      columnStart: Math.max(0, offense.column - 1),
      lineEnd: Math.max(0, offense.line - 1),
      columnEnd: Math.max(0, offense.column - 1),
      code: offense.rule,
      message,
      severity: OFFENSE_SEVERITY[offense.severity],
      source: "stylelint",
      correctable: false,
      docsUrl: getDocsUrl(offense.rule),
    });
  });

  return Promise.resolve(offenses);
};

export const parseFixOutput: LinterParseFixOutputFunction = ({ stdout }) =>
  Promise.resolve(stdout);

function getDocsUrl(code: string) {
  if (!code) {
    return undefined;
  }

  const [plugin, rule] = code.split("/");

  const urls: { [key: string]: string } = {
    standard: `https://stylelint.io/user-guide/rules/list/${plugin}`,
  };

  if (rule) {
    return urls[plugin];
  }

  return urls.standard;
}
