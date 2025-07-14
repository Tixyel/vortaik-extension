import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import BaseCommand from './BaseCommand';
import { WidgetVersionBadgeProvider } from './lib';

function registerCommands(context: vscode.ExtensionContext, dir: string) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file),
      stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      registerCommands(context, fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith(`.js`)) {
      const Command = require(fullPath).default;

      if (Command && Command.prototype instanceof BaseCommand) {
        const instance: BaseCommand = new Command();

        const disposable = vscode.commands.registerCommand('vortaik.' + instance.name, instance.run.bind(context));
        context.subscriptions.push(disposable);
      }
    }
  }
}

export function activate(context: vscode.ExtensionContext) {
  registerCommands(context, path.join(__dirname, 'commands'));

  const provider = new WidgetVersionBadgeProvider();

  context.subscriptions.push(vscode.window.registerFileDecorationProvider(provider));

  vscode.workspace.onDidSaveTextDocument((doc) => {
    if (path.basename(doc.uri.fsPath) === 'widget.ini') {
      provider.scanWorkspace();
    }
  });

  vscode.workspace.onDidChangeWorkspaceFolders(() => provider.scanWorkspace());
}

export function deactivate() {}
