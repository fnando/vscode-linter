import { sortBy, uniq } from "lodash";
import {
  LinterGetOffensesFunction,
  LinterParseFixOutputFunction,
  LinterGetIgnoreFilePragmaFunction,
  LinterOffense,
  LinterOffenseSeverity,
} from "vscode-linter-api";

interface PylintOffense {
  line: number;
  column: number;
  type: string;
  module: string;
  obj: string;
  path: string;
  symbol: string;
  message: string;
  "message-id": string;
}

const offenseSeverity: { [key: string]: LinterOffenseSeverity } = {
  convention: LinterOffenseSeverity.warning,
  warning: LinterOffenseSeverity.error,
};

export const getOffenses: LinterGetOffensesFunction = ({ stdout, uri }) => {
  const result: PylintOffense[] = JSON.parse(stdout);
  const offenses: LinterOffense[] = [];

  result.forEach((offense: PylintOffense) => {
    offenses.push({
      uri,
      lineStart: Math.max(0, offense.line - 1),
      columnStart: Math.max(0, offense.column - 1),
      lineEnd: Math.max(0, offense.line - 1),
      columnEnd: Math.max(0, offense.column - 1),
      code: `${offense.symbol} - ${offense["message-id"]}`,
      message: offense.message,
      severity: offenseSeverity[offense.type],
      source: "pylint",
      correctable: false,
      docsUrl: getDocsUrl(offense["message-id"]),
    });
  });

  return offenses;
};

export const parseFixOutput: LinterParseFixOutputFunction = ({ stdout }) =>
  stdout;

export const getIgnoreFilePragma: LinterGetIgnoreFilePragmaFunction = ({
  line,
  code,
}) => {
  const { text } = line;
  const matches = text.match(/^#\s*pylint:\s+disable=(.*?)$/);
  let existingRules: string[] = [code.replace(/ - .*?$/, "")];

  if (matches) {
    existingRules = (matches[1] ?? "").split(/,\s*/).map((item) => item.trim());
  }

  const pragma = [
    "# pylint: disable=",
    sortBy(uniq(existingRules)).join(", "),
  ].join("");

  if (matches) {
    return pragma;
  }

  return line.number === 0
    ? [pragma, text].join("\n")
    : [text, pragma].join("\n");
};

function getDocsUrl(code: string) {
  if (!code) {
    return undefined;
  }

  return `http://pylint-messages.wikidot.com/messages:${code.toLowerCase()}`;
}
