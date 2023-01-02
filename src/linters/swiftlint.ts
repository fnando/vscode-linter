import { sortBy, uniq } from "lodash";
import { camelizeObject } from "../helpers/camelizeObject";
import {
  LinterGetOffensesFunction,
  LinterGetIgnoreFilePragmaFunction,
  LinterGetIgnoreLinePragmaFunction,
  LinterOffense,
  LinterOffenseSeverity,
} from "vscode-linter-api";

export interface SwiftOffense {
  character: number;
  line: number;
  reason: string;
  ruleId: string;
  severity: string;
  type: string;
}

const filePragmaRegex = /^\/\/\s*swiftlint:disable(?:\s+(.+))?$/;
const linePragmaRegex = /^\/\/\s*swiftlint:disable:next(?:\s+(.+))?$/;

const offenseSeverity: { [key: string]: LinterOffenseSeverity } = {
  error: LinterOffenseSeverity.error,
  warning: LinterOffenseSeverity.warning,
};

export const getOffenses: LinterGetOffensesFunction = ({ stdout, uri }) => {
  const result: SwiftOffense[] = JSON.parse(stdout);
  const offenses: LinterOffense[] = [];

  result.forEach((offense) => {
    offense = camelizeObject(offense);

    const lineStart = Math.max(0, offense.line - 1);
    const columnStart = Math.max(0, offense.character - 1);

    offenses.push({
      uri,
      lineStart,
      lineEnd: lineStart,
      columnStart,
      columnEnd: columnStart,
      message: offense.reason,
      code: offense.ruleId,
      source: "swiftlint",
      correctable: false,
      severity: offenseSeverity[offense.severity.toLowerCase()],
      docsUrl: getDocsUrl(offense.ruleId),
    });
  });

  return Promise.resolve(offenses);
};

export const getIgnoreFilePragma: LinterGetIgnoreFilePragmaFunction = ({
  line,
  code,
}) => {
  const { text } = line;
  const matches = text.match(filePragmaRegex);
  let existingRules: string[] = [];

  if (matches) {
    existingRules.push(
      ...(matches[1] ?? "").split(",").map((item) => item.trim()),
    );
  }

  existingRules.push(code);

  const pragma = [
    "// swiftlint:disable",
    sortBy(uniq(existingRules)).join(" "),
  ].join(" ");

  if (matches) {
    return Promise.resolve(pragma);
  }

  return Promise.resolve(
    line.number === 0 ? [pragma, text].join("\n") : [text, pragma].join("\n"),
  );
};

export const getIgnoreLinePragma: LinterGetIgnoreLinePragmaFunction = ({
  line,
  code,
  indent,
}) => {
  const { text } = line;
  const matches = text.match(linePragmaRegex);
  let existingRules: string[] = [];

  if (matches) {
    existingRules = (matches[1] ?? "").split(/\s+/);
  }

  existingRules.push(code);

  const pragma = [
    `${indent}// swiftlint:disable:next`,
    sortBy(uniq(existingRules)).join(" "),
  ].join(" ");

  if (matches) {
    return Promise.resolve(pragma);
  }

  if (line.number === 0 && text.match(filePragmaRegex)) {
    return Promise.resolve([text, pragma].join("\n"));
  }

  return Promise.resolve(
    line.number === 0 ? [pragma, text].join("\n") : [text, pragma].join("\n"),
  );
};

function getDocsUrl(code: string): string {
  return `https://realm.github.io/SwiftLint/${code}.html`;
}
