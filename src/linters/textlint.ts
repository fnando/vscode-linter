import {
  LinterGetOffensesFunction,
  LinterOffense,
  LinterOffenseSeverity,
} from "vscode-linter-api";
import { debug } from "../helpers/debug";

type TextlintPayload = {
  messages: TextlintOffense[];
}[];

interface TextlintOffense {
  type: string;
  ruleId: string;
  message: string;
  index: number;
  line: number;
  column: number;
  severity: number;
  fix?: unknown;
}

const offenseSeverity: { [key: string]: LinterOffenseSeverity } = {
  1: LinterOffenseSeverity.warning,
  2: LinterOffenseSeverity.error,
};

export const getOffenses: LinterGetOffensesFunction = ({ stdout, stderr, uri }) => {
  if (!stdout) {
    debug("textlint: stdout was empty, but here's stderr:", { stderr });

    return [];
  }

  const result: TextlintPayload = JSON.parse(stdout);
  const offenses: LinterOffense[] = [];

  result[0].messages.forEach((offense) => {
    const lineStart = Math.max(0, offense.line - 1);
    const columnStart = Math.max(0, offense.column - 1);

    offenses.push({
      severity: offenseSeverity[offense.severity],
      message: offense.message.trim(),
      lineStart,
      lineEnd: lineStart,
      columnStart,
      columnEnd: columnStart,
      correctable: false,
      code: offense.ruleId,
      uri,
      source: "textlint",
    });
  });

  return offenses;
};
