import path from 'path';
import fs from '../services/fs.service';

export async function getFiles(widgetPath: string) {
  const all_files = await fs.readDirectory(path.join(widgetPath, 'development'));
  const development_files = (all_files ?? []).reduce((acc: Record<string, string>, file: string) => {
    acc[file] = path.join(widgetPath, 'development', file);

    return acc;
  }, {});

  return development_files;
}
