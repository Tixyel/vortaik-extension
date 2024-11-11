import * as vscode from 'vscode';
import BaseCommand from '../../BaseCommand';
import { UpdateAllSimulations } from '../../functions/simulation';

export default class updateAllSimulation extends BaseCommand {
  name = 'updateAllSimulation';

  async run() {
    await UpdateAllSimulations();

    vscode.window.showInformationMessage('All simulations updated!');
  }
}
