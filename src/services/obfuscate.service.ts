import { obfuscate, ObfuscationResult } from 'javascript-obfuscator';
import postcss, { Result } from 'postcss';
import autoprefixer from 'autoprefixer';
import { minify } from 'html-minifier';
import cssnano from 'cssnano';

export default class ObfuscateService {
  public async obfuscateCSS(content: string): Promise<string> {
    try {
      const result: Result = await postcss([autoprefixer({ overrideBrowserslist: ['Chrome 127'] }), cssnano({ preset: 'default' })]).process(content, { from: undefined });

      return result.css;
    } catch (error) {
      console.error('Error processing CSS:', error);
      throw error;
    }
  }

  public async obfuscateJavaScript(content: string): Promise<ObfuscationResult> {
    try {
      return obfuscate(content, { compact: true, log: false, debugProtection: false });
    } catch (error) {
      console.error('Error obfuscating JavaScript:', error);
      throw error;
    }
  }

  public async minifyHTML(content: string): Promise<string> {
    try {
      const body = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1]?.trim() ?? '';

      return minify(body, {
        removeComments: true,
        collapseWhitespace: true,
        removeAttributeQuotes: false,
        minifyCSS: true,
        minifyJS: true,
      });
    } catch (error) {
      console.error('Error minifying HTML:', error);
      throw error;
    }
  }
}
