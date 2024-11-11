import * as fs from 'fs/promises';
import * as path from 'path';

export default class FileSystemService {
  public static async readFile(filePath: string): Promise<string | undefined> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      console.error(`Failed to read file: ${error}`);
      return undefined;
    }
  }

  public static async createFile(filePath: string, content: string, format: BufferEncoding = 'utf-8'): Promise<void> {
    try {
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, content, format);
    } catch (error) {
      console.error(`Failed to create file: ${error}`);
    }
  }

  public static async createDirectory(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      console.error(`Failed to create directory: ${error}`);
    }
  }

  public static async readDirectory(dirPath: string): Promise<string[] | undefined> {
    try {
      return await fs.readdir(dirPath);
    } catch (error) {
      console.error(`Failed to read directory: ${error}`);
      return undefined;
    }
  }
}
