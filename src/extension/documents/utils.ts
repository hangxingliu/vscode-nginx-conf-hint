export const nginxDocsScheme = 'nginx-doc';
export const nginxDocsAuthority = 'hangxingliu.nginx-conf-hint';

export const enum NginxDocsType {
	directive = 'directive',
	variable = 'variable',
}

export function getNginxDocsUri(
	type: NginxDocsType,
	name: string,
): string {
	return `${nginxDocsScheme}://${nginxDocsAuthority}/${type}/${name}.html`;
}

type _VSCodeUri = {
	scheme: string
	authority: string
	path: string
}
export function parseNginxDocsUri(uri: _VSCodeUri): { type: NginxDocsType, name: string } {
	if (!uri) return null;
	if (uri.scheme !== nginxDocsScheme || uri.authority !== nginxDocsAuthority)
		return null;
	const mtx = uri.path.match(/^\/(\w+)\/([\w-]+)/);
	if (!mtx) return null;
	const type = mtx[1];
	if (type !== NginxDocsType.directive && type !== NginxDocsType.variable)
		return null;

	return {
		type,
		name: mtx[2],
	};
}
