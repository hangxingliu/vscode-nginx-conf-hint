import { Uri, workspace } from "vscode";
import { logger } from "../logger";

export async function loadHintDataAsync(uri: Uri): Promise<unknown[][]> {
	let data: unknown[][];
	try {
		const fileData = await workspace.fs.readFile(uri);
		const json = new TextDecoder().decode(fileData);
		data = JSON.parse(json);
		if (!Array.isArray(data))
			throw new Error(`Invalid hint data: ${json.slice(0, 128)}...`);
	} catch (error) {
		logger.error(`load hint data "${uri.path}" failed: ${error.message}`, error);
		return null;
	}
	return data;
}
