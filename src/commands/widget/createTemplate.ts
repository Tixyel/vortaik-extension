import * as vscode from 'vscode';
import BaseCommand from '../../BaseCommand';
import * as path from 'path';
import FileSystemService from '../../services/fs.service';

interface DefaultContent {
  name: string;
}

interface FileContent extends DefaultContent {
  type: 'file';
  content?: string;
}

interface FolderContent extends DefaultContent {
  type: 'folder';
  content?: Content[];
}

type Content = FileContent | FolderContent;

async function createContent(basePath: string, content: Content[]) {
  for (const item of content) {
    const itemPath = path.join(basePath, item.name);

    switch (item.type) {
      case 'file':
        await FileSystemService.createFile(itemPath, item.content ?? '');
        break;

      case 'folder':
        await FileSystemService.createDirectory(itemPath);

        if (item.content) {
          await createContent(itemPath, item.content);
        }
        break;
    }
  }
}

export default class createTemplate extends BaseCommand {
  name = 'createTemplate';

  async run({ fsPath }: { fsPath: string }) {
    if (!vscode.workspace.workspaceFolders || !vscode.workspace.workspaceFolders[0]) {
      vscode.window.showInformationMessage('Você precisa abrir uma workspace ou uma pasta');
      return;
    }

    const config = vscode.workspace.getConfiguration().get('vortaik') as { fileStructure: Content[] };

    console.log(config.fileStructure);

    const content: Content[] = config.fileStructure ?? [
      {
        type: 'folder',
        name: '00 - Widget template',
        content: [
          {
            type: 'folder',
            name: 'development',
            content: [
              { type: 'file', name: 'index.html', content: '' },
              { type: 'file', name: 'style.css', content: '' },
              { type: 'file', name: 'script.jsx', content: '' },
              { type: 'file', name: 'cf.json', content: '{}' },
            ],
          },
          {
            type: 'folder',
            name: 'finished',
            content: [
              { type: 'file', name: 'HTML.txt', content: '' },
              { type: 'file', name: 'CSS.txt', content: '' },
              { type: 'file', name: 'SCRIPT.txt', content: '' },
              { type: 'file', name: 'CF.txt', content: '{}' },
            ],
          },
          { type: 'folder', name: 'widget.io' },
          { type: 'file', name: 'widget.ini', content: 'simulation=10.1.0' },
        ],
      },
    ];

    await createContent(fsPath, content);
  }
}
