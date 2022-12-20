import {
  LinterGetOffensesFunction,
  LinterOffense,
  LinterOffenseSeverity,
} from "vscode-linter-api";

type Line = {
  filePath: string;
  errors: Error[];
};

type Error = {
  message: string;
  rule: string;
  line: number;
};

export const getOffenses: LinterGetOffensesFunction = ({ stderr, uri }) => {
  const lines = JSON.parse(stderr);
  const offenses: LinterOffense[] = [];

  lines.forEach((line: Line) => {
    line.errors.forEach((error: Error) => {
      const message = error.message;
      const lineStart = Math.max(0, Number(error.line) - 1);

      offenses.push({
        severity: LinterOffenseSeverity.error,
        message,
        lineStart,
        lineEnd: lineStart,
        columnStart: 0,
        columnEnd: 0,
        correctable: false,
        code: "",
        uri,
        source: "gherkin-lint",
      });
    });
  });

  return offenses;
};
