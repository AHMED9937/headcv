import type { ResumeData } from "@headcv/schema/resume/data";
import { ORPCError } from "@orpc/client";
import { resumeDataSchema } from "@headcv/schema/resume/data";
import { defaultResumeData } from "@headcv/schema/resume/default";
import { generateId } from "@headcv/utils/string";

type UnknownRecord = Record<string, unknown>;
type ItemDefaults = Record<string, unknown>;

const websiteDefaults = { url: "", label: "", inlineLink: false };

const itemDefaults = {
	experience: {
		company: "",
		position: "",
		location: "",
		period: "",
		website: websiteDefaults,
		description: "",
		roles: [],
	},
	education: {
		school: "",
		degree: "",
		area: "",
		grade: "",
		location: "",
		period: "",
		website: websiteDefaults,
		description: "",
	},
	skills: { icon: "", iconColor: "", name: "", proficiency: "", level: 0, keywords: [] },
	languages: { language: "", fluency: "", level: 0 },
	profiles: { icon: "", iconColor: "", network: "", username: "", website: websiteDefaults },
	projects: { name: "", period: "", website: websiteDefaults, description: "" },
	awards: { title: "", awarder: "", date: "", website: websiteDefaults, description: "" },
	certifications: { title: "", issuer: "", date: "", website: websiteDefaults, description: "" },
	publications: { title: "", publisher: "", date: "", website: websiteDefaults, description: "" },
	volunteer: { organization: "", location: "", period: "", website: websiteDefaults, description: "" },
	interests: { icon: "", iconColor: "", name: "", keywords: [] },
	references: { name: "", position: "", website: websiteDefaults, phone: "", description: "" },
} as const;

type SectionName = keyof typeof itemDefaults;

const meaningfulFields: Record<SectionName, readonly string[]> = {
	experience: ["company", "position", "description", "location", "period", "website", "roles"],
	education: ["school", "degree", "area", "grade", "description", "location", "period", "website"],
	skills: ["name", "proficiency", "keywords"],
	languages: ["language", "fluency", "level"],
	profiles: ["network", "username", "website"],
	projects: ["name", "description", "period", "website"],
	awards: ["title", "awarder", "date", "description", "website"],
	certifications: ["title", "issuer", "date", "description", "website"],
	publications: ["title", "publisher", "date", "description", "website"],
	volunteer: ["organization", "description", "location", "period", "website"],
	interests: ["name", "keywords"],
	references: ["name", "position", "phone", "description", "website"],
};

function isRecord(value: unknown): value is UnknownRecord {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMeaningful(value: unknown): boolean {
	if (typeof value === "string") return value.trim().length > 0;
	if (typeof value === "number") return value !== 0;
	if (Array.isArray(value)) return value.some(isMeaningful);
	if (isRecord(value)) return Object.values(value).some(isMeaningful);
	return false;
}

function defaultValue(value: unknown): unknown {
	if (Array.isArray(value)) return [];
	if (isRecord(value)) return structuredClone(value);
	return value;
}

function fillItem(raw: unknown, defaults: ItemDefaults, path: string, warnings: string[]): UnknownRecord | undefined {
	if (!isRecord(raw)) {
		warnings.push(`${path} was not an object; filtered out`);
		return undefined;
	}

	const item: UnknownRecord = {};
	for (const [key, fallback] of Object.entries(defaults)) {
		const value = raw[key];
		if (value === undefined || value === null || typeof value !== typeof fallback) {
			item[key] = defaultValue(fallback);
			warnings.push(`${path}.${key} was missing; defaulted to ${JSON.stringify(fallback)}`);
		} else if (isRecord(fallback)) {
			item[key] = { ...fallback, ...(isRecord(value) ? value : {}) };
		} else {
			item[key] = value;
		}
	}

	item.id = typeof raw.id === "string" && raw.id ? raw.id : generateId();
	if (!(typeof raw.id === "string" && raw.id)) warnings.push(`${path}.id was missing; generated a new UUID`);
	item.hidden = typeof raw.hidden === "boolean" ? raw.hidden : false;
	if (typeof raw.hidden !== "boolean") warnings.push(`${path}.hidden was missing; defaulted to false`);
	return item;
}

function normalizeRoles(raw: unknown, path: string, warnings: string[]): UnknownRecord[] {
	if (!Array.isArray(raw)) return [];
	return raw.flatMap((role, index) => {
		const normalized = fillItem(role, { position: "", period: "", description: "" }, `${path}[${index}]`, warnings);
		if (!normalized) return [];
		delete normalized.hidden;
		return isMeaningful(normalized.position) || isMeaningful(normalized.period) || isMeaningful(normalized.description)
			? [normalized]
			: [];
	});
}

function normalizeSectionItems(name: SectionName, raw: unknown, warnings: string[]): UnknownRecord[] {
	if (!Array.isArray(raw)) return [];
	return raw.flatMap((value, index) => {
		const path = `${name}[${index}]`;
		const item = fillItem(value, itemDefaults[name], path, warnings);
		if (!item) return [];
		if (name === "experience")
			item.roles = normalizeRoles(isRecord(value) ? value.roles : undefined, `${path}.roles`, warnings);
		if (!meaningfulFields[name].some((field) => isMeaningful(item[field]))) return [];
		// Canonical item schemas require their identifying field to have length >= 1.
		// A single space remains visually empty while allowing a useful partial item to survive validation.
		const requiredField: Partial<Record<SectionName, string>> = {
			experience: "company",
			education: "school",
			skills: "name",
			languages: "language",
			profiles: "network",
			projects: "name",
			awards: "title",
			certifications: "title",
			publications: "title",
			volunteer: "organization",
			interests: "name",
			references: "name",
		};
		const required = requiredField[name];
		if (required && !isMeaningful(item[required])) item[required] = " ";
		return [item];
	});
}

function normalizeCustomFields(raw: unknown, warnings: string[]): UnknownRecord[] {
	if (!Array.isArray(raw)) return [];
	return raw.flatMap((value, index) => {
		const item = fillItem(value, { icon: "", text: "", link: "" }, `basics.customFields[${index}]`, warnings);
		if (!item) return [];
		delete item.hidden;
		return isMeaningful(item.text) || isMeaningful(item.link) ? [item] : [];
	});
}

function normalizeCustomSections(raw: unknown, warnings: string[]): UnknownRecord[] {
	if (!Array.isArray(raw)) return [];
	return raw.flatMap((value, index) => {
		if (!isRecord(value)) return [];
		const type = typeof value.type === "string" ? value.type : "summary";
		const section: UnknownRecord = {
			id: typeof value.id === "string" && value.id ? value.id : generateId(),
			type,
			title: typeof value.title === "string" ? value.title : "",
			columns: typeof value.columns === "number" ? value.columns : 1,
			hidden: typeof value.hidden === "boolean" ? value.hidden : false,
		};
		if (!(typeof value.id === "string" && value.id))
			warnings.push(`customSections[${index}].id was missing; generated a new UUID`);
		const defaults =
			type === "summary"
				? { content: "" }
				: type === "cover-letter"
					? { recipient: "", content: "" }
					: itemDefaults[type as SectionName];
		if (!defaults) {
			warnings.push(`customSections[${index}].type was invalid; filtered out`);
			return [];
		}
		section.items = Array.isArray(value.items)
			? value.items.flatMap((item, itemIndex) => {
					const normalized = fillItem(item, defaults, `customSections[${index}].items[${itemIndex}]`, warnings);
					return normalized && Object.keys(defaults).some((field) => isMeaningful(normalized[field]))
						? [normalized]
						: [];
				})
			: [];
		return isMeaningful(section.title) || (section.items as unknown[]).length > 0 ? [section] : [];
	});
}

/** Deeply normalizes untrusted LLM output into canonical resume data. */
export function normalizeResumeData(input: unknown): { data: ResumeData; warnings: string[] } {
	if (!isRecord(input)) {
		throw new ORPCError("BAD_REQUEST", { status: 400, message: "Resume parser output must be a JSON object" });
	}
	const warnings: string[] = [];
	const base = structuredClone(defaultResumeData) as ResumeData;
	const basics = isRecord(input.basics) ? input.basics : {};
	for (const key of ["name", "headline", "email", "phone", "location"] as const) {
		if (typeof basics[key] === "string") base.basics[key] = basics[key];
		else warnings.push(`basics.${key} was missing; defaulted to ''`);
	}
	base.basics.website = isRecord(basics.website)
		? {
				url: typeof basics.website.url === "string" ? basics.website.url : "",
				label: typeof basics.website.label === "string" ? basics.website.label : "",
			}
		: { ...defaultResumeData.basics.website };
	base.basics.customFields = normalizeCustomFields(
		basics.customFields,
		warnings,
	) as ResumeData["basics"]["customFields"];

	const summary = isRecord(input.summary) ? input.summary : {};
	base.summary = {
		title: typeof summary.title === "string" ? summary.title : "",
		columns: typeof summary.columns === "number" ? summary.columns : 1,
		hidden: typeof summary.hidden === "boolean" ? summary.hidden : false,
		content: typeof summary.content === "string" ? summary.content : "",
	};
	const sections = isRecord(input.sections) ? input.sections : {};
	for (const name of Object.keys(itemDefaults) as SectionName[]) {
		const source = isRecord(sections[name]) ? sections[name] : {};
		const target = base.sections[name];
		target.title = typeof source.title === "string" ? source.title : target.title;
		target.columns = typeof source.columns === "number" ? source.columns : target.columns;
		target.hidden = typeof source.hidden === "boolean" ? source.hidden : target.hidden;
		target.items = normalizeSectionItems(name, source.items, warnings) as typeof target.items;
	}
	base.customSections = normalizeCustomSections(input.customSections, warnings) as ResumeData["customSections"];
	// Picture and metadata are deliberately controlled by the application, not the LLM.
	base.picture = structuredClone(defaultResumeData.picture);
	base.metadata = structuredClone(defaultResumeData.metadata);

	try {
		return { data: resumeDataSchema.parse(base), warnings };
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown schema validation error";
		warnings.push(`Final schema validation failed: ${message}`);
		throw new ORPCError("BAD_REQUEST", {
			status: 400,
			message: `Unable to normalize resume parser output: ${message}`,
		});
	}
}
