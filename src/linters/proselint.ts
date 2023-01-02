import {
  LinterGetOffensesFunction,
  LinterOffense,
  LinterOffenseSeverity,
} from "vscode-linter-api";
import { debug } from "../helpers/debug";

export interface ProselintPayload {
  data: ProselintData;
  status: string;
}

export interface ProselintData {
  errors: ProselintError[];
}

export interface ProselintError {
  check: string;
  column: number;
  end: number;
  extent: number;
  line: number;
  message: string;
  severity: string;
  start: number;
}

const offenseSeverity: { [key: string]: LinterOffenseSeverity } = {
  warning: LinterOffenseSeverity.warning,
  error: LinterOffenseSeverity.error,
  suggestion: LinterOffenseSeverity.hint,
};

export const getOffenses: LinterGetOffensesFunction = ({
  stdout,
  stderr,
  uri,
}) => {
  if (!stdout) {
    debug("proselint: stdout was empty, but here's stderr:", { stderr });

    return Promise.resolve([]);
  }

  const result: ProselintPayload = JSON.parse(stdout);
  const offenses: LinterOffense[] = [];

  result.data.errors.forEach((offense) => {
    const lineStart = Math.max(0, offense.line - 1);
    const columnStart = Math.max(0, offense.column - 1);
    const columnEnd = columnStart + (offense.end - offense.start) - 1;

    offenses.push({
      severity: offenseSeverity[offense.severity],
      message: offense.message.trim(),
      lineStart,
      lineEnd: lineStart,
      columnStart,
      columnEnd,
      correctable: false,
      code: offense.check,
      uri,
      source: "proselint",
    });
  });

  return Promise.resolve(offenses);
};
