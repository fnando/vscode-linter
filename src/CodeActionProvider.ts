import * as vscode from "vscode";
import { LinterConfig, LinterOffense } from "vscode-linter-api";
import { getLinterConfig } from "./helpers/getLinterConfig";
import { sortBy, uniqBy } from "lodash";

type GetActionParams = {
  linterConfig: LinterConfig;
  offense: LinterOffense;
  diagnostic: vscode.Diagnostic;
};

export class CodeActionProvider implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix,
  ];

  public offenses: LinterOffense[];
  public diagnostics: vscode.DiagnosticCollection;

  constructor(
    diagnostics: vscode.DiagnosticCollection,
    offenses: LinterOffense[],
  ) {
    this.offenses = offenses;
    this.diagnostics = diagnostics;
  }

  public provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range,
  ): vscode.CodeAction[] | undefined {
    let actions: vscode.CodeAction[] = [];

    this.diagnostics.get(document.uri)?.forEach((diagnostic) => {
      const offense = this.offenses.find(
        (offense) =>
          offense.source === diagnostic.source &&
          offense.code === diagnostic.code &&
          offense.lineStart === range.start.line &&
          offense.columnStart === range.start.character &&
          offense.lineEnd === range.end.line &&
          offense.columnEnd === range.end.character &&
          offense.message === diagnostic.message,
      );

      if (!offense) {
        return;
      }

      const linterConfig = getLinterConfig(offense.source);

      actions.push(...this.getActions({ diagnostic, linterConfig, offense }));
    });

    return this.dedupe(actions);
  }

  private getActions(params: GetActionParams): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];
    const isFixable = this.hasFixableOffense(params.linterConfig.name);

    actions.push(this.getViewSiteAction(params));

    if (params.linterConfig.capabilities.includes("fix-all") && isFixable) {
      actions.push(this.getFixAllAction(params));
    }

    if (
      params.linterConfig.capabilities.includes("fix-category") &&
      isFixable
    ) {
      actions.push(this.getFixCategoryAction(params));
    }

    if (params.linterConfig.capabilities.includes("fix-one") && isFixable) {
      actions.push(this.getFixOneAction(params));
    }

    if (
      params.linterConfig.capabilities.includes("fix-inline") &&
      params.offense.inlineFix
    ) {
      actions.push(this.getFixInlineAction(params));
    }

    if (params.linterConfig.capabilities.includes("ignore-file")) {
      actions.push(this.getIgnoreFileAction(params));
    }

    if (params.linterConfig.capabilities.includes("ignore-line")) {
      actions.push(this.getIgnoreLineAction(params));
    }

    if (params.linterConfig.capabilities.includes("ignore-eol")) {
      actions.push(this.getIgnoreEolAction(params));
    }

    if (params.offense.docsUrl) {
      actions.push(this.getViewDocsUrlAction(params));
    }

    return actions;
  }

  private hasFixableOffense(source: string): boolean {
    const fixable = this.offenses.reduce(
      (buffer, offense) =>
        Object.assign(buffer, {
          [offense.source]: offense.correctable || buffer[offense.source],
        }),
      {} as { [key: string]: boolean },
    );

    return fixable[source];
  }

  private getFixAllAction({
    linterConfig,
    diagnostic,
    offense,
  }: GetActionParams): vscode.CodeAction {
    const action = new vscode.CodeAction(
      `Fix all ${linterConfig.name} offenses on this file`,
    );
    action.kind = vscode.CodeActionKind.QuickFix;
    action.diagnostics = [diagnostic];
    action.command = {
      title: "",
      command: "linter.fix",
      arguments: [offense, "fix-all"],
    };

    return action;
  }

  private getFixOneAction({
    linterConfig,
    diagnostic,
    offense,
  }: GetActionParams): vscode.CodeAction {
    const action = new vscode.CodeAction(
      `Fix ${linterConfig.name}:${offense.code} on this line`,
    );
    action.kind = vscode.CodeActionKind.QuickFix;
    action.diagnostics = [diagnostic];
    action.command = {
      title: "",
      command: "linter.fix",
      arguments: [offense, "fix-one"],
    };

    return action;
  }

  private getFixInlineAction({
    linterConfig,
    diagnostic,
    offense,
  }: GetActionParams): vscode.CodeAction {
    const action = new vscode.CodeAction(
      `Fix this ${linterConfig.name}:${offense.code} offense`,
    );
    action.kind = vscode.CodeActionKind.QuickFix;
    action.diagnostics = [diagnostic];
    action.command = {
      title: "",
      command: "linter.fixInline",
      arguments: [offense],
    };

    return action;
  }

  private getFixCategoryAction({
    linterConfig,
    diagnostic,
    offense,
  }: GetActionParams): vscode.CodeAction {
    const action = new vscode.CodeAction(
      `Fix ${linterConfig.name}:${offense.code} on this file`,
    );
    action.kind = vscode.CodeActionKind.QuickFix;
    action.diagnostics = [diagnostic];
    action.command = {
      title: "",
      command: "linter.fix",
      arguments: [offense, "fix-category"],
    };

    return action;
  }

  private getViewSiteAction({
    linterConfig,
    diagnostic,
  }: GetActionParams): vscode.CodeAction {
    const action = new vscode.CodeAction(`View ${linterConfig.name}'s website`);
    action.kind = vscode.CodeActionKind.QuickFix;
    action.diagnostics = [diagnostic];
    action.command = {
      title: "",
      command: "linter.openUrl",
      arguments: [linterConfig.url],
    };

    return action;
  }

  private getViewDocsUrlAction({
    linterConfig,
    diagnostic,
    offense,
  }: GetActionParams): vscode.CodeAction {
    const action = new vscode.CodeAction(
      `View ${linterConfig.name}:${offense.code}'s documentation`,
    );
    action.kind = vscode.CodeActionKind.QuickFix;
    action.diagnostics = [diagnostic];
    action.command = {
      title: "",
      command: "linter.openUrl",
      arguments: [offense.docsUrl],
    };

    return action;
  }

  private getIgnoreFileAction({
    linterConfig,
    diagnostic,
    offense,
  }: GetActionParams): vscode.CodeAction {
    const action = new vscode.CodeAction(
      `Ignore ${linterConfig.name}:${offense.code} for whole file`,
    );
    action.kind = vscode.CodeActionKind.QuickFix;
    action.diagnostics = [diagnostic];
    action.command = {
      title: "",
      command: "linter.ignoreOffense",
      arguments: [offense, "ignore-file"],
    };

    return action;
  }

  private getIgnoreLineAction({
    linterConfig,
    diagnostic,
    offense,
  }: GetActionParams): vscode.CodeAction {
    const action = new vscode.CodeAction(
      `Ignore ${linterConfig.name}:${offense.code} for this line`,
    );
    action.kind = vscode.CodeActionKind.QuickFix;
    action.diagnostics = [diagnostic];
    action.command = {
      title: "",
      command: "linter.ignoreOffense",
      arguments: [offense, "ignore-line"],
    };

    return action;
  }

  private getIgnoreEolAction({
    linterConfig,
    diagnostic,
    offense,
  }: GetActionParams): vscode.CodeAction {
    const action = new vscode.CodeAction(
      `Ignore ${linterConfig.name}:${offense.code} on this line`,
    );
    action.kind = vscode.CodeActionKind.QuickFix;
    action.diagnostics = [diagnostic];
    action.command = {
      title: "",
      command: "linter.ignoreOffense",
      arguments: [offense, "ignore-eol"],
    };

    return action;
  }

  private dedupe(actions: vscode.CodeAction[]): vscode.CodeAction[] {
    return sortBy(uniqBy(actions, "title"), "title");
  }
}
