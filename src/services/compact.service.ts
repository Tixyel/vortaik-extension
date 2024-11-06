import JSZip from 'jszip';
import FileSystemService from './fs.service';
import ObfuscateService from './obfuscate.service';

export interface CompactServiceOptions {
  files: Record<string, string>;
  finished: Record<string, string>;
  find: {
    html: string;
    css: string;
    javascript: string;
    fields: string;
    simulation: string;
  };
  'widget.io': Record<string, string>;
}

export default class CompactService {
  private FileSystemService: FileSystemService = new FileSystemService();
  private ObfuscateService: ObfuscateService = new ObfuscateService();

  files: CompactServiceOptions['files'];
  finished: CompactServiceOptions['finished'];
  'widget.io': CompactServiceOptions['widget.io'];

  constructor(options: CompactServiceOptions) {
    this.files = Object.entries(options.find).reduce((acc: Record<string, string>, [key, value]: string[]) => {
      const available: string[] = value.split(',').map((w) => w.trim());
      const findPath = Object.keys(options.files).find((key: string) => available.includes(key));

      if (findPath) {
        acc[key] = options.files[findPath];
      }

      return acc;
    }, {});

    this.finished = options.finished;
    this['widget.io'] = options['widget.io'];
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

  public async compact(files: CompactServiceOptions['files']) {
    const [html, css, javascript, simulation] = await Promise.all([
      this.ObfuscateService.minifyHTML(files.html),
      this.ObfuscateService.obfuscateCSS(files.css),
      this.ObfuscateService.obfuscateJavaScript(files.javascript),
      this.ObfuscateService.obfuscateJavaScript(files.simulation),
    ]);

    const compactedFiles: CompactServiceOptions['files'] = {
      'html': html,
      'css': css,
      'javascript': javascript.getObfuscatedCode(),
      'simulation': simulation.getObfuscatedCode(),
      'fields': files.fields,
    };

    return compactedFiles;
  }

  public async finishFiles(files: CompactServiceOptions['files']) {
    const finishedFiles = Object.entries(this.finished).reduce((acc: Record<string, string>, [key, value]) => {
      acc[key] = value
        .split(',')
        .map((w) => w.trim())
        .map((w) => {
          let value = files[w];

          if (key === 'HTML.txt') {
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

  public async createZip(files: CompactServiceOptions['files']) {
    const zip = new JSZip();

    const widgetIOFiles = Object.entries(this['widget.io']).reduce((acc: Record<string, string>, [key, value]) => {
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
