/* eslint-disable @typescript-eslint/naming-convention */
import {
  LinterGetOffensesFunction,
  LinterOffense,
  LinterOffenseSeverity,
} from "vscode-linter-api";
import { debug } from "../helpers/debug";

type ERBFile = {
  offenses: ERBLintOffense[];
};

type ERBLintOffense = {
  linter: string;
  message: string;
  location: {
    start_line: number;
    start_column: number;
    last_line: number;
    last_column: number;
    length: number;
  };
};

export const getOffenses: LinterGetOffensesFunction = ({ stdout, uri }) => {
  const offenses: LinterOffense[] = [];

  if (stdout.trim() === "") {
    return offenses;
  }

  const report = JSON.parse(stdout);
  const files: ERBFile[] = report.files ?? [];

  files.forEach((file) => {
    file.offenses.forEach((offense) => {
      offenses.push({
        severity: LinterOffenseSeverity.error,
        message: offense.message,
        lineStart: Math.max(0, offense.location.start_line - 1),
        lineEnd: Math.max(0, offense.location.last_line - 1),
        columnStart: offense.location.start_column,
        columnEnd: offense.location.last_column,
        correctable: false,
        code: offense.linter,
        source: "erb_lint",
        uri,
      });
    });
  });

  return offenses;
};
