import * as vscode from 'vscode';
import BaseCommand from '../../BaseCommand';
import { getSimulation, SelectSimulation } from '../../functions/simulation';
import CompactService from '../../services/compact.service';
import fss from '../../services/fs.service';
import path from 'path';

export default class updateSimulationFile extends BaseCommand {
  name = 'updateSimulationFile';

  async run({ fsPath }: { fsPath: string }) {
    if (!vscode.workspace.workspaceFolders || !vscode.workspace.workspaceFolders[0]) {
      vscode.window.showInformationMessage('Você precisa abrir uma workspace ou uma pasta');
      return;
    }

    const workspace = vscode.workspace.workspaceFolders[0];

    const compact = new CompactService(await getSimulation(workspace.uri.fsPath));

    const files = await compact.readAllFiles();
    const simulation = await SelectSimulation(files, fsPath);

    if (simulation && simulation.content) {
      await fss.createFile(path.join(workspace.uri.fsPath, '.vortaik', 'simulation.js'), simulation?.content);

      vscode.window.showInformationMessage('Simulations.js updated to current widget version!');
    } else {
      vscode.window.showInformationMessage('Não encontrei essa versão...');
    }
  }
}
