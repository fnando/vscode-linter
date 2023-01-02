import { sortBy, uniq } from "lodash";
import { camelizeObject } from "../helpers/camelizeObject";
import {
  LinterGetOffensesFunction,
  LinterParseFixOutputFunction,
  LinterGetIgnoreEolPragmaFunction,
  LinterOffense,
  LinterOffenseSeverity,
} from "vscode-linter-api";

export interface SqlfluffOffense {
  filepath: string;
  violations: {
    lineNo: number;
    linePos: number;
    code: string;
    description: string;
  }[];
}

export const getOffenses: LinterGetOffensesFunction = ({ stdout, uri }) => {
  const result: SqlfluffOffense[] = camelizeObject(JSON.parse(stdout));
  const offenses: LinterOffense[] = [];

  result[0]?.violations.forEach((offense) => {
    offense = camelizeObject(offense);

    const lineStart = Math.max(0, offense.lineNo - 1);
    const columnStart = Math.max(0, offense.linePos - 1);

    offenses.push({
      uri,
      lineStart,
      lineEnd: lineStart,
      columnStart,
      columnEnd: columnStart,
      message: offense.description,
      code: offense.code,
      source: "sqlfluff",
      correctable: false,
      severity: LinterOffenseSeverity.error,
      docsUrl: getDocsUrl(offense.code),
    });
  });

  return Promise.resolve(offenses);
};

export const parseFixOutput: LinterParseFixOutputFunction = ({ stdout }) =>
  Promise.resolve(stdout);

export const getIgnoreEolPragma: LinterGetIgnoreEolPragmaFunction = ({
  line,
  code,
}) => {
  const regexp = /^(.*?)(?:\s+--noqa: disable=(.+))?$/;
  const matches = line.text.match(regexp);
  let existingRules: string[] = [code];

  if (matches && matches[2]) {
    existingRules = matches[2].split(",").map((item) => item.trim());
  }

  existingRules = uniq(sortBy(existingRules));

  return Promise.resolve(
    [
      (matches && matches[1]) || "",
      `--noqa: disable=${existingRules.join(", ")}`,
    ].join(" "),
  );
};

function getDocsUrl(code: string): string {
  return `https://docs.sqlfluff.com/en/stable/rules.html#sqlfluff.core.rules.Rule_${code}`;
}
