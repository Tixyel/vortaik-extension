import * as vscode from 'vscode';
import fs from '../services/fs.service';
import * as ini from 'ini';
import path from 'path';
import Gist, { RequestHeaders } from '../services/gist.service';

export async function getSimulation(workspacePath: string) {
  const vortaikPath = path.join(workspacePath, '.vortaik');
  const all_files = await fs.readDirectory(vortaikPath);
  const javascript_files = (all_files ?? []).filter((file) => file.endsWith('.js'));

  return javascript_files.reduce((acc: Record<string, string>, file) => {
    acc[file] = path.join(vortaikPath, file);

    return acc;
  }, {});
}

export async function isSimulationOutdated(files: Record<string, string>, widgetPath: string): Promise<{ outdated: boolean; widget?: string; current: string }> {
  const regex = /\b(\d+\.\d+\.\d+)\b/g;

  const simulationMatch = files.simulation.match(regex);
  const simulationVersion: string = simulationMatch?.[0] as string;

  try {
    const iniFile = await fs.readFile(path.join(widgetPath, 'widget.ini'));

    // 0 == same
    // -1 == higher
    // 1 == lower
    const isDifferent = (a: string, b: string) => [1, -1].some((e) => e === a.localeCompare(b, undefined, { numeric: true }));

    if (iniFile && simulationVersion) {
      const options = ini.parse(iniFile);
      const widgetVersion = options['simulation'];

      if (widgetVersion && isDifferent(simulationVersion, widgetVersion) && simulationVersion !== widgetVersion) {
        console.error('Simulation version is incorrect', widgetVersion, simulationVersion);

        return { outdated: true, widget: widgetVersion, current: simulationVersion };
      } else {
        console.error('Widget version is undefined or the current version is present.', widgetPath, widgetVersion, simulationVersion);
      }
    } else {
      console.error("Can't find widget.ini or simulation version", simulationVersion, iniFile);
    }
  } catch (error) {
    console.error('Something went wrong', error);
  }

  return { outdated: false, current: simulationVersion };
}

export async function SelectSimulation(files: Record<string, string>, widgetPath: string) {
  const { outdated, widget } = await isSimulationOutdated(files, widgetPath);
  const config: { githubToken: string; simulationGistID: string } | undefined = vscode.workspace.getConfiguration().get('vortaik');

  if (config && config.githubToken && config.simulationGistID && outdated) {
    const token = config.githubToken;
    const simulationGistID = config.simulationGistID;
    const headers: RequestHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

    try {
      const global = await Gist.get(simulationGistID, headers);
      const file = global.files[widget + '.js'];

      if (global && file) {
        return { version: widget, content: await Gist.getFileContentFromRawUrl(file.raw_url, headers) };
      }
    } catch (error) {
      console.error(error);

      return undefined;
    }
  }
}

export async function UpdateAllSimulations() {
  const config: { githubToken: string; simulationGistID: string } | undefined = vscode.workspace.getConfiguration().get('vortaik');

  if (config && config.githubToken && config.simulationGistID) {
    const token = config.githubToken;
    const simulationGistID = config.simulationGistID;
    const headers: RequestHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

    const [simulations, global] = await Promise.all([await getAllSimulationsGist(headers), await Gist.get(simulationGistID, headers)]);

    if (global) {
      await Gist.addFiles(
        global.id,
        headers,
        Object.values(simulations).reduce((acc, gist) => {
          const file = gist.files['simulation.js'];

          if (file) {
            acc = { ...acc, [gist.description.replace('Simulation ', '') + '.js']: file };
          }

          return acc;
        }, {}),
      );
    }
  }
}

async function getAllSimulationsGist(headers: RequestHeaders) {
  const all = await Gist.getAll(headers, { per_page: String(100) });

  const filtered = all.filter(
    (gist) =>
      gist.description.toLowerCase().includes('simulation') &&
      gist.description.match(/\b(\d+\.\d+\.\d+)\b/g) &&
      Object.keys(gist.files).some((file) => file.includes('simulation.js')),
  );

  return filtered;
}
