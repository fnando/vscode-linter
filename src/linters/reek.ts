import { camelizeObject } from "../helpers/camelizeObject";
import {
  LinterGetOffensesFunction,
  LinterGetIgnoreLinePragmaFunction,
  LinterOffense,
  LinterOffenseSeverity,
} from "vscode-linter-api";

export interface ReekOffense {
  context: string;
  lines: number[];
  message: string;
  smellType: string;
  source: string;
  documentationLink: string;
  depth?: number;
  name?: string;
}

export const getOffenses: LinterGetOffensesFunction = ({ stdout, uri }) => {
  const result = JSON.parse(stdout);
  const offenses: LinterOffense[] = [];

  result.forEach((offense: ReekOffense) => {
    offense = camelizeObject(offense);

    offenses.push({
      uri,
      lineStart: Math.max(0, offense.lines[0] - 1),
      columnStart: 0,
      lineEnd: Math.max(0, offense.lines[0] - 1),
      columnEnd: 0,
      code: offense.smellType,
      message: `${offense.context} ${offense.message}`,
      severity: LinterOffenseSeverity.warning,
      source: "reek",
      correctable: false,
      docsUrl: offense.documentationLink,
    });
  });

  return Promise.resolve(offenses);
};

export const getIgnoreLinePragma: LinterGetIgnoreLinePragmaFunction = ({
  line,
  code,
  indent,
}) => Promise.resolve([line.text, `${indent}# :reek:${code}`].join("\n"));
