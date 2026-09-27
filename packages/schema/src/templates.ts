import z from "zod";

export const templateSchema = z.enum([
	"azurill",
	"bronzor",
	"chikorita",
	"ditgar",
	"ditto",
	"gengar",
	"glalie",
	"kakuna",
	"lapras",
	"leafish",
	"meowth",
	"onyx",
	"pikachu",
	"rhyhorn",
	"scizor",
]);

export type Template = z.infer<typeof templateSchema>;

// Default accent per template, sampled from its gallery preview and kept at >= 4.5:1 contrast on white.
export const templatePrimaryColors = {
	azurill: "rgba(0, 102, 204, 1)",
	bronzor: "rgba(31, 41, 55, 1)",
	chikorita: "rgba(38, 64, 92, 1)",
	ditgar: "rgba(0, 114, 188, 1)",
	ditto: "rgba(219, 39, 119, 1)",
	gengar: "rgba(91, 33, 182, 1)",
	glalie: "rgba(46, 98, 128, 1)",
	kakuna: "rgba(161, 98, 7, 1)",
	lapras: "rgba(14, 116, 144, 1)",
	leafish: "rgba(77, 124, 15, 1)",
	meowth: "rgba(79, 70, 229, 1)",
	onyx: "rgba(31, 41, 55, 1)",
	pikachu: "rgba(138, 110, 20, 1)",
	rhyhorn: "rgba(38, 38, 38, 1)",
	scizor: "rgba(23, 23, 23, 1)",
} as const satisfies Record<Template, string>;

// The single red default every resume used before per-template colors existed.
const legacyDefaultPrimaryColor = "rgba(220, 38, 38, 1)";

/** True when the color is the current template's default or the legacy red default. */
export const isDefaultPrimaryColor = (color: string, template: Template): boolean =>
	color === legacyDefaultPrimaryColor || color === templatePrimaryColors[template];
