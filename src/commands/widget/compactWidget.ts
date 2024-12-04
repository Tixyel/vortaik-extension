import * as vscode from 'vscode';
import BaseCommand from '../../BaseCommand';
import CompactService, { CompactFilesOptions } from '../../services/compact.service';
import fs from '../../services/fs.service';
import path from 'path';
import { getSimulation, SelectSimulation } from '../../functions/simulation';
import { getFiles } from '../../functions/developmentFolder';

export default class compactWidget extends BaseCommand {
  name = 'compactWidget';

  async run({ fsPath }: { fsPath: string }) {
    if (!vscode.workspace.workspaceFolders || !vscode.workspace.workspaceFolders[0]) {
      vscode.window.showInformationMessage('Você precisa abrir uma workspace ou uma pasta');
      return;
    }

    const workspace = vscode.workspace.workspaceFolders[0];

    let [development, simulation] = await Promise.all([getFiles(fsPath), getSimulation(workspace.uri.fsPath)]);

    const compact = new CompactService({ ...development, ...simulation });

    const files = await compact.readAllFiles();

    const correctSimulation = await SelectSimulation(files, fsPath);

    if (correctSimulation && correctSimulation.content) {
      files.simulation = correctSimulation.content;
    }

    const [finishedFiles, betaFinishedFiles] = await Promise.all([
      generateFinishedWidget(compact, files, fsPath, { css: { overrideBrowserslist: ['Chrome 103'], removeNesting: true } }),
      generateFinishedWidget(compact, files, fsPath),
    ]);

    Object.entries(finishedFiles).forEach(([file, content]) => fs.createFile(path.join(fsPath, 'finished', file), content));
    Object.entries(betaFinishedFiles).forEach(([file, content]) => fs.createFile(path.join(fsPath, 'finished • beta', file), content));

    vscode.window.showInformationMessage('Finished files generated!');

    await Promise.all([
      generateWidgetIO(compact, finishedFiles, fsPath, `${path.basename(fsPath)}`),
      generateWidgetIO(compact, betaFinishedFiles, fsPath, `${path.basename(fsPath)} • Beta`),
    ]);

    vscode.window.showInformationMessage('Widget.io zip file generated!');
  }
}

async function generateFinishedWidget(compact: CompactService, files: Record<string, string>, widgetPath: string, options?: CompactFilesOptions) {
  const compacted = await compact.compact(files, options);

  const finishedFiles = await compact.finishFiles(compacted);

  return finishedFiles;
}

async function generateWidgetIO(compact: CompactService, files: Record<string, string>, widgetPath: string, fileName: string) {
  const zip = await compact.createZip(files);

  return await fs.createFile(path.join(widgetPath, 'widget.io', `${fileName}.zip`), zip, 'base64');
}
