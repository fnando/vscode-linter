import {
  LinterGetIgnoreFilePragmaFunction,
  LinterGetIgnoreLinePragmaFunction,
  LinterGetOffensesFunction,
  LinterOffenseSeverity,
} from "vscode-linter-api";
import { camelizeObject } from "../helpers/camelizeObject";

export interface CredoPayload {
  issues: CredoIssue[];
}

export interface CredoIssue {
  category: string;
  check: string;
  column: number;
  columnEnd: number;
  filename: string;
  lineNo: number;
  message: string;
  priority: number;
  scope: string;
  trigger: string;
}

const filePragmaRegex = /^# credo:disable-for-this-file(?:\s+(.+))?$/;
const linePragmaRegex = /^\s*# credo:disable-for-next-line(?:\s+(.+))?$/;

export const getOffenses: LinterGetOffensesFunction = ({ uri, stdout }) => {
  const result: CredoPayload = JSON.parse(stdout);

  const offenses = result.issues.map((item) => {
    item = camelizeObject(item);

    const lineStart = Math.max(0, item.lineNo - 1);
    const columnStart = Math.max(0, item.column - 1);
    const columnEnd = Math.max(0, item.columnEnd - 1);

    const offense = {
      uri,
      severity: LinterOffenseSeverity.warning,
      source: "credo",
      message: item.message,
      code: item.check,
      lineStart,
      columnStart,
      lineEnd: lineStart,
      columnEnd,
      correctable: false,
    };

    return offense;
  });

  return Promise.resolve(offenses);
};

export const getIgnoreFilePragma: LinterGetIgnoreFilePragmaFunction = ({
  line,
  code,
}) => {
  return Promise.resolve(`# credo:disable-for-this-file ${code}\n${line.text}`);
};

export const getIgnoreLinePragma: LinterGetIgnoreLinePragmaFunction = ({
  line,
  code,
  indent,
}) => {
  if (line.text.match(filePragmaRegex)) {
    return Promise.resolve(
      `${line.text}\n${indent}# credo:disable-for-next-line ${code}`,
    );
  }

  if (line.text.match(linePragmaRegex)) {
    return Promise.resolve(`${indent}# credo:disable-for-next-line`);
  }

  const pragma = `${indent}# credo:disable-for-next-line ${code}`;

  return Promise.resolve(
    line.number === 0 ? `${pragma}\n${line.text}` : `${line.text}\n${pragma}`,
  );
};
