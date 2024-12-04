import * as vscode from 'vscode';
import JSZip from 'jszip';
import FileSystemService from './fs.service';
import ObfuscateService from './obfuscate.service';
import { Options } from 'html-minifier';
import autoprefixer from 'autoprefixer';
import { ObfuscatorOptions } from 'javascript-obfuscator';

export interface CompactServiceFiles {
  [key: string]: string;
}

export interface CompactFilesOptions {
  html?: Options;
  css?: autoprefixer.Options & { removeNesting?: boolean };
  javascript?: ObfuscatorOptions;
  simulation?: ObfuscatorOptions;
}

export default class CompactService {
  private FileSystemService = FileSystemService;
  private ObfuscateService = ObfuscateService;

  'files': Record<string, string>;
  'finished': Record<string, string>;
  'widgetIO': Record<string, string>;

  constructor(files: CompactServiceFiles) {
    const config = vscode.workspace.getConfiguration().get('vortaik') as { fileMappings: { [key: string]: Record<string, string> } };

    this.finished = config.fileMappings.finished;
    this['widgetIO'] = config.fileMappings.widgetIO;

    this.files = Object.entries(config.fileMappings.find).reduce((acc: Record<string, string>, [key, value]: string[]) => {
      const available: string[] = value.split(',').map((w) => w.trim());
      const findPath = Object.keys(files).find((key: string) => available.includes(key));

      if (findPath) {
        acc[key] = files[findPath];
      }

      return acc;
    }, {});
  }

  public async readAllFiles() {
    const fileContents = await Promise.all(
      Object.entries(this.files).map(async ([key, fsPath]) => {
        return [key, await this.FileSystemService.readFile(fsPath)];
      }),
    );

    return fileContents.reduce((acc: Record<string, string>, [key, content]) => {
      if (key && content !== undefined) {
        acc[key] = content;
      }

      return acc;
    }, {});
  }

  public async compact(files: CompactServiceFiles, options?: CompactFilesOptions) {
    const [html, css, javascript, simulation] = await Promise.all([
      this.ObfuscateService.minifyHTML(files.html, options?.html),
      this.ObfuscateService.obfuscateCSS(files.css, options?.css),
      this.ObfuscateService.obfuscateJavaScript(files.javascript, options?.javascript),
      this.ObfuscateService.obfuscateJavaScript(files.simulation, options?.simulation),
    ]);

    const compactedFiles: CompactServiceFiles = {
      'html': html,
      'css': css,
      'javascript': javascript.getObfuscatedCode(),
      'simulation': simulation.getObfuscatedCode(),
      'fields': files.fields,
    };

    return compactedFiles;
  }

  public async finishFiles(files: CompactServiceFiles) {
    const finishedFiles = Object.entries(this.finished).reduce((acc: Record<string, string>, [key, value]) => {
      acc[key] = value
        .split(',')
        .map((w) => w.trim())
        .map((w) => {
          let value = files[w];

          if (key.startsWith('HTML') || key.endsWith('.html')) {
            if (['javascript', 'simulation'].includes(w)) {
              value = `<script>${value}</script>`;
            } else if (['css'].includes(w)) {
              value = `<style>${value}</style>`;
            }
          }

          return value;
        })
        .join(' ');

      return acc;
    }, {});

    return finishedFiles;
  }

  public async createZip(files: CompactServiceFiles) {
    const zip = new JSZip();

    const widgetIOFiles = Object.entries(this['widgetIO']).reduce((acc: Record<string, string>, [key, value]) => {
      acc[key] = files[value];

      return acc;
    }, {});

    Object.entries(widgetIOFiles)
      .filter(([name, content]) => name && content)
      .forEach(([name, content]) => zip.file(name, content));

    zip.file('widget.ini', `[HTML]\npath = "html.txt"\n\n[CSS]\npath = "css.txt"\n\n[JS]\npath = "js.txt"\n\n[FIELDS]\npath = "fields.txt"\n\n[DATA]\npath = "data.txt"`);

    zip.file('data.txt', '{}');

    return zip
      .generateInternalStream({ type: 'base64' })
      .accumulate()
      .then((data) => data);
  }
}
