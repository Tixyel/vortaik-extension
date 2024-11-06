export default abstract class BaseCommand {
  public abstract name: string;
  public abstract run(...args: any[]): Promise<any> | any;
}
