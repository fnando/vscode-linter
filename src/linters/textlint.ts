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
  fix?: { range: [number, number]; text: string };
}

const offenseSeverity: { [key: string]: LinterOffenseSeverity } = {
  1: LinterOffenseSeverity.warning,
  2: LinterOffenseSeverity.error,
};

export const getOffenses: LinterGetOffensesFunction = ({
  stdout,
  stderr,
  uri,
}) => {
  if (!stdout) {
    debug("textlint: stdout was empty, but here's stderr:", { stderr });

    return [];
  }

  const result: TextlintPayload = JSON.parse(stdout);
  const offenses: LinterOffense[] = [];

  result[0].messages.forEach((item) => {
    const lineStart = Math.max(0, item.line - 1);
    const columnStart = Math.max(0, item.column - 1);

    const offense: LinterOffense = {
      severity: offenseSeverity[item.severity],
      message: item.message.trim(),
      lineStart,
      lineEnd: lineStart,
      columnStart,
      columnEnd: columnStart,
      correctable: false,
      code: item.ruleId,
      uri,
      source: "textlint",
    };

    if (item.fix) {
      offense.inlineFix = {
        replacement: item.fix.text,
        offset: item.fix.range,
      };
    }

    offenses.push(offense);
  });

  return offenses;
};
