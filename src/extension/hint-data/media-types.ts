export type MediaTypeTuple = [mediaType: string, desc?: string];
export const mediaTypes: { [x: string]: Array<MediaTypeTuple> } = {
	application: require("../../../assets/mediatypes/application.json"),
	audio: require("../../../assets/mediatypes/audio.json"),
	font: require("../../../assets/mediatypes/font.json"),
	image: require("../../../assets/mediatypes/image.json"),
	multipart: require("../../../assets/mediatypes/multipart.json"),
	text: require("../../../assets/mediatypes/text.json"),
	video: require("../../../assets/mediatypes/video.json"),
};
export const mediaTypePrefixes = Object.keys(mediaTypes);
export const mediaTypePrefixSet = new Set(mediaTypePrefixes);
