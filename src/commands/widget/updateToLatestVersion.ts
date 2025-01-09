import * as vscode from 'vscode';
import BaseCommand from '../../BaseCommand';
import { getGlobalSimulationGist } from '../../functions/simulation';
import CompactService from '../../services/compact.service';
import fss from '../../services/fs.service';
import path from 'path';
import GistService, { RequestHeaders } from '../../services/gist.service';

export default class updateToLatestVersion extends BaseCommand {
  name = 'updateToLatestVersion';

  async run({ fsPath }: { fsPath: string }) {
    if (!vscode.workspace.workspaceFolders || !vscode.workspace.workspaceFolders[0]) {
      vscode.window.showInformationMessage('Você precisa abrir uma workspace ou uma pasta');
      return;
    }

    const config: { githubToken: string; simulationGistID: string } | undefined = vscode.workspace.getConfiguration().get('vortaik');

    const workspace = vscode.workspace.workspaceFolders[0];

    if (config && config.githubToken && config.simulationGistID) {
      const token = config.githubToken;
      const headers: RequestHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

      const globalGist = await getGlobalSimulationGist();

      if (globalGist) {
        let [version, { raw_url }] = Object.entries(globalGist.files)
          .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
          .reverse()[0];

        version = version.replace('.js', '');

        await fss.createFile(path.join(fsPath, 'widget.ini'), `simulation=${version}`);

        const simulation = await GistService.getFileContentFromRawUrl(raw_url, headers);

        if (simulation) {
          await fss.createFile(path.join(workspace.uri.fsPath, '.vortaik', 'simulation.js'), simulation);
        } else {
          vscode.window.showInformationMessage('Não encontrei essa versão...');
        }
      }
    }
  }
}
