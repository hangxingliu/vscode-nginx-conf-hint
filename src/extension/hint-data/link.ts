export function getNginxExternalDocsLink(item: {
	module: string;
	link: string;
}): string {
	if (!item || typeof item !== "object") return;

	const { link } = item;
	if (typeof link === "string" && link) {
		if (!/^https?:\/\//i.test(link)) {
			if (link.startsWith("/")) return `https://nginx.org${link}`;
			else return `https://nginx.org/en/docs/${link}`;
		}
		return link;
	}
}
