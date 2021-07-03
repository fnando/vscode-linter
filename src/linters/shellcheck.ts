import {
  LinterGetOffensesFunction,
  LinterOffense,
  LinterOffenseSeverity,
} from "vscode-linter-api";

export interface ShellcheckOffense {
  file: string;
  line: number;
  endLine: number;
  column: number;
  endColumn: number;
  level: string;
  code: number;
  message: string;
}

const offenseSeverity: { [key: string]: LinterOffenseSeverity } = {
  error: LinterOffenseSeverity.error,
  warning: LinterOffenseSeverity.warning,
  info: LinterOffenseSeverity.information,
  style: LinterOffenseSeverity.information,
};

export const getOffenses: LinterGetOffensesFunction = ({ stdout, uri }) => {
  const result: ShellcheckOffense[] = JSON.parse(stdout);
  const offenses: LinterOffense[] = [];

  result.forEach((offense) => {
    offenses.push({
      uri,
      lineStart: Math.max(0, offense.line - 1),
      columnStart: Math.max(0, offense.column - 1),
      lineEnd: Math.max(0, offense.endLine - 1),
      columnEnd: Math.max(0, offense.endColumn - 1),
      message: offense.message,
      code: offense.code.toString(),
      source: "shellcheck",
      correctable: false,
      severity: offenseSeverity[offense.level],
    });
  });

  return offenses;
};
