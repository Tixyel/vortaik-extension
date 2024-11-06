import * as vscode from 'vscode';
import BaseCommand from '../BaseCommand';
import CompactService, { CompactServiceOptions } from '../services/compact.service';
import FileSystemService from '../services/fs.service';
import path from 'path';
import * as ini from 'ini';

export default class HelloWorld extends BaseCommand {
  name = 'helloWorld';

  async run({ fsPath }: { fsPath: string }) {
    if (!vscode.workspace.workspaceFolders || !vscode.workspace.workspaceFolders[0]) {
      vscode.window.showInformationMessage('Você precisa abrir uma workspace ou uma pasta');
      return;
    }

    const workspace = vscode.workspace.workspaceFolders[0];

    const fs = new FileSystemService();

    const getFiles = async (): Promise<Record<string, string>> => {
        const all_files = await fs.readDirectory(path.join(fsPath, 'development'));
        const development_files = (all_files ?? []).reduce((acc: Record<string, string>, file: string) => {
          acc[file] = path.join(fsPath, 'development', file);

          return acc;
        }, {});

        return development_files;
      },
      getSimulation = async (): Promise<Record<string, string>> => {
        const all_files = await fs.readDirectory(path.join(workspace.uri.fsPath));
        const javascript_files = (all_files ?? []).filter((file) => file.endsWith('.js'));

        return javascript_files.reduce((acc: Record<string, string>, file) => {
          acc[file] = path.join(workspace.uri.fsPath, file);

          return acc;
        }, {});
      };

    const [development, simulation] = await Promise.all([getFiles(), getSimulation()]);

    const compact = new CompactService({
      files: { ...development, ...simulation },
      find: {
        html: 'index.html, main.html',
        css: 'style.css, styles.css, style.scss, styles.scss',
        javascript: 'script.jsx, script.js, scripts.jsx, scripts.js',
        fields: 'cf.json, fields.json, custom-fields.json',
        simulation: 'simulation.js, latest.js',
      },
      finished: {
        'HTML.txt': 'simulation, html',
        'CSS.txt': 'css,',
        'SCRIPT.txt': 'javascript',
        'CF.txt': 'fields',
      },
      'widget.io': {
        'css.txt': 'CSS.txt',
        'html.txt': 'HTML.txt',
        'js.txt': 'SCRIPT.txt',
        'fields.txt': 'CF.txt',
      },
    });

    const files = await compact.readAllFiles();

    async function getCorrectSimulation(files: Pick<CompactServiceOptions['files'], 'simulation'>) {
      const regex = /\b(\d+\.\d+\.\d+)\b/g;

      const simulationMatch = files.simulation.match(regex);
      const simulationVersion: string = simulationMatch?.[0] as string;

      const iniFile = await fs.readFile(path.join(fsPath, 'widget.ini'));

      const isDifferent = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true }) === 1;

      if (iniFile && simulationVersion) {
        const options = ini.parse(iniFile);

        const widgetVersion = options['simulation'];

        if (widgetVersion && isDifferent(simulationVersion, widgetVersion) && simulationVersion !== widgetVersion) {
          console.log('Simulation version is incorrect');
        }
      }
    }

    getCorrectSimulation({ simulation: files.simulation });

    const compacted = await compact.compact(files);

    const finishedFiles = await compact.finishFiles(compacted);

    Object.entries(finishedFiles).forEach(([file, content]) => fs.createFile(path.join(fsPath, 'finished', file), content));

    vscode.window.showInformationMessage('Finished files generated!');

    const zip = await compact.createZip(finishedFiles);

    await fs.createFile(path.join(fsPath, 'widget.io', `${path.basename(fsPath)}.zip`), zip, 'base64');

    vscode.window.showInformationMessage('Widget.io zip file generated!');
  }
}
