import * as ini from 'ini';
import * as vscode from 'vscode';

export class WidgetVersionBadgeProvider implements vscode.FileDecorationProvider {
  private widgetFolders: Map<string, string> = new Map();

  private _onDidChangeFileDecorations = new vscode.EventEmitter<vscode.Uri | vscode.Uri[] | undefined>();
  onDidChangeFileDecorations: vscode.Event<vscode.Uri | vscode.Uri[] | undefined> =
    this._onDidChangeFileDecorations.event;

  constructor() {
    this.scanWorkspace();
  }

  async scanWorkspace() {
    this.widgetFolders.clear();

    const files = await vscode.workspace.findFiles('**/widget.ini');

    console.log(`Found ${files.length} widget.ini files.`, files);

    for (const file of files) {
      try {
        const content = await vscode.workspace.fs.readFile(file);

        const values = ini.parse(content.toString());

        const version = values['simulation'];

        if (version) {
          const folderUri = vscode.Uri.joinPath(file, '..');

          this.widgetFolders.set(folderUri.toString(), version);
        }
      } catch (error) {
        console.error(`Error reading ${file}:`, error);
      }
    }

    this._onDidChangeFileDecorations.fire(undefined);
  }

  provideFileDecoration(
    uri: vscode.Uri,
    token: vscode.CancellationToken,
  ): vscode.ProviderResult<vscode.FileDecoration> {
    const version = this.widgetFolders.get(uri.toString());

    if (version) {
      console.log(`Checking decoration for ${uri.toString()}: version=${version}`);

      return {
        badge: String(version).split('.')[0],
        tooltip: `Widget simulation version: ${version}`,
        color: new vscode.ThemeColor('vortaik.fileBadgeColor'),
      };
    }

    return undefined;
  }
}
