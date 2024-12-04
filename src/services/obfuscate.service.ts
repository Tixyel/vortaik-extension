import { obfuscate, ObfuscationResult, ObfuscatorOptions } from 'javascript-obfuscator';
import postcss, { Result } from 'postcss';
import autoprefixer from 'autoprefixer';
import { minify, Options } from 'html-minifier';
import cssnano from 'cssnano';
import nested from 'postcss-nested';

export default class ObfuscateService {
  public static async obfuscateCSS(content: string, options?: autoprefixer.Options & { removeNesting?: boolean }): Promise<string> {
    try {
      const plugins: postcss.AcceptedPlugin[] = [autoprefixer({ overrideBrowserslist: ['Chrome 127'], ...options }), cssnano({ preset: 'default' })];

      if (options?.removeNesting) {
        plugins.unshift(nested());
      }

      const result: Result = await postcss(plugins).process(content, { from: undefined });

      return result.css;
    } catch (error) {
      console.error('Error processing CSS:', error);
      throw error;
    }
  }

  public static async obfuscateJavaScript(content: string, options?: ObfuscatorOptions): Promise<ObfuscationResult> {
    try {
      return obfuscate(content, {
        compact: true,
        log: false,
        debugProtection: false,
        selfDefending: false,
        deadCodeInjection: false,
        controlFlowFlattening: false,
        unicodeEscapeSequence: false,
        stringArray: false,
        simplify: false,
        identifierNamesGenerator: 'mangled',
        ...options,
      });
    } catch (error) {
      console.error('Error obfuscating JavaScript:', error);
      throw error;
    }
  }

  public static async minifyHTML(content: string, options?: Options): Promise<string> {
    try {
      const body = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1]?.trim() ?? '';

      return minify(body, {
        removeComments: true,
        collapseWhitespace: true,
        removeAttributeQuotes: false,
        minifyCSS: true,
        minifyJS: true,
        ...options,
      });
    } catch (error) {
      console.error('Error minifying HTML:', error);
      throw error;
    }
  }
}
