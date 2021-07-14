import * as vscode from "vscode";
import * as path from "path";
import {
  LinterGetOffensesFunction,
  LinterOffenseSeverity,
} from "vscode-linter-api";
import { camelizeObject } from "../helpers/camelizeObject";
import { findRootDir } from "../helpers/findRootDir";

export interface BrakemanPayload {
  warnings: BrakemanOffense[];
}

export interface BrakemanOffense {
  warningType: string;
  warningCode: number;
  fingerprint: string;
  checkName: string;
  message: string;
  file: string;
  line: number;
  renderPath: { line: number }[];
  link: string;
  code: null | string;
  userInput: null | string;
  confidence: string;
}

export const getOffenses: LinterGetOffensesFunction = ({ stdout, uri }) => {
  const result: BrakemanPayload = JSON.parse(stdout);
  const rootDir = findRootDir(uri);

  return result.warnings
    .map((offense) => {
      offense = camelizeObject(offense);

      const lineStart = offense.line - 1;
      const fileUri = vscode.Uri.parse(path.join(rootDir, offense.file));

      return {
        uri: fileUri,
        code: offense.checkName,
        message: offense.message,
        lineStart,
        columnStart: 0,
        lineEnd: lineStart,
        columnEnd: 0,
        source: "brakeman",
        severity: LinterOffenseSeverity.warning,
        correctable: false,
        docsUrl: offense.link,
      };
    })
    .filter((offense) => offense.uri.path === uri.path);
};
