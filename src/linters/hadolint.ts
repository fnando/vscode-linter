import { sortBy, uniq } from "lodash";
import {
  LinterGetOffensesFunction,
  LinterGetIgnoreLinePragmaFunction,
  LinterOffense,
  LinterOffenseSeverity,
} from "vscode-linter-api";
import { camelizeObject } from "../helpers/camelizeObject";

export interface HadolintOffense {
  line: number;
  code: string;
  message: string;
  column: number;
  file: string;
  level: string;
}

const linePragmaRegex = /^# hadolint ignore=(.+)$/;

const offenseSeverity: { [key: string]: LinterOffenseSeverity } = {
  error: LinterOffenseSeverity.error,
  warning: LinterOffenseSeverity.warning,
};

export const getOffenses: LinterGetOffensesFunction = ({ stdout, uri }) => {
  const result: HadolintOffense[] = JSON.parse(stdout);
  const offenses: LinterOffense[] = [];

  result.forEach((offense) => {
    offense = camelizeObject(offense);

    const lineStart = Math.max(0, offense.line - 1);
    const columnStart = Math.max(0, offense.column - 1);

    offenses.push({
      uri,
      lineStart,
      lineEnd: lineStart,
      columnStart,
      columnEnd: columnStart,
      message: offense.message,
      code: offense.code,
      source: "hadolint",
      correctable: false,
      severity: offenseSeverity[offense.level],
      docsUrl: getDocsUrl(offense.code),
    });
  });

  return offenses;
};

export const getIgnoreLinePragma: LinterGetIgnoreLinePragmaFunction = ({
  line,
  code,
  indent,
}) => {
  const { text } = line;
  const matches = text.match(linePragmaRegex);
  let existingRules: string[] = [code];

  if (matches) {
    existingRules = (matches[1] ?? "").split(",").map((item) => item.trim());
  }

  const pragma = [
    `${indent}# hadolint ignore=`,
    sortBy(uniq(existingRules)).join(","),
  ].join("");

  if (matches) {
    return pragma;
  }

  return line.number === 0
    ? [pragma, text].join("\n")
    : [text, "", pragma].join("\n");
};

function getDocsUrl(code: string): string {
  return `https://github.com/hadolint/hadolint/wiki/${code}`;
}
