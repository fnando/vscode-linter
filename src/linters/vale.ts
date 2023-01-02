import {
  LinterGetOffensesFunction,
  LinterOffense,
  LinterOffenseSeverity,
} from "vscode-linter-api";
import { camelizeObject } from "../helpers/camelizeObject";

export interface ValePayload {
  [key: string]: ValeOffense[];
}

export interface ValeOffense {
  check: string;
  description: string;
  line: number;
  link: string;
  message: string;
  severity: string;
  span: number[];
  match: string;
}

const offenseSeverity: { [key: string]: LinterOffenseSeverity } = {
  warning: LinterOffenseSeverity.warning,
  error: LinterOffenseSeverity.error,
  suggestion: LinterOffenseSeverity.hint,
};

export const getOffenses: LinterGetOffensesFunction = ({ stdout, uri }) => {
  const result: ValePayload = JSON.parse(stdout);
  const offenses: LinterOffense[] = [];

  Object.values(result)[0].forEach((offense) => {
    offense = camelizeObject(offense);

    const lineStart = Math.max(0, offense.line - 1);
    const columnStart = Math.max(0, offense.span[0] - 1);
    const columnEnd = Math.max(0, offense.span[1] - 1);

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
      source: "vale",
    });
  });

  return Promise.resolve(offenses);
};
