import type { JsonPatchOperation, Operation } from "@headcv/resume/patch";
import type { ResumeData } from "@headcv/schema/resume/data";
import type { LeftSidebarSection } from "@/libs/resume/section";
import { t } from "@lingui/core/macro";
import { getSectionTitle, leftSidebarSections } from "@/libs/resume/section";

const JSON_POINTER_TOKEN = /~1|~0/g;

export function decodeJsonPointerSegment(segment: string): string {
	return segment.replace(JSON_POINTER_TOKEN, (token) => (token === "~1" ? "/" : "~"));
}

export function decodeJsonPointerPath(path: string): string[] {
	if (!path.startsWith("/")) return [];
	return path.slice(1).split("/").map(decodeJsonPointerSegment);
}

export function getValueAtJsonPointer<T = unknown>(data: unknown, pointer: string): T | undefined {
	const segments = decodeJsonPointerPath(pointer);
	let current: unknown = data;
	for (const segment of segments) {
		if (current === null || current === undefined) return undefined;
		if (Array.isArray(current)) {
			const index = Number(segment);
			if (Number.isNaN(index)) return undefined;
			current = current[index];
		} else if (typeof current === "object") {
			current = (current as Record<string, unknown>)[segment];
		} else {
			return undefined;
		}
	}
	return current as T | undefined;
}

export function getAffectedSectionFromPath(path: string): LeftSidebarSection | null {
	const segments = decodeJsonPointerPath(path);
	const first = segments[0];
	if (!first) return null;
	if (first === "customSections") return "custom";

	if (first === "sections") {
		const second = segments[1];
		if (second && leftSidebarSections.includes(second as LeftSidebarSection)) {
			return second as LeftSidebarSection;
		}
		return null;
	}

	if (first === "picture" || first === "basics" || first === "summary") {
		return first as LeftSidebarSection;
	}

	return null;
}

function getCustomSectionIdFromPath(path: string, currentData: ResumeData, snapshotData: ResumeData): string | null {
	const segments = decodeJsonPointerPath(path);
	if (segments[0] !== "customSections") return null;

	const index = Number(segments[1]);
	if (Number.isInteger(index) && index >= 0) {
		const section =
			getValueAtJsonPointer<ResumeData["customSections"][number]>(currentData, `/customSections/${index}`) ??
			getValueAtJsonPointer<ResumeData["customSections"][number]>(snapshotData, `/customSections/${index}`);
		if (section?.id) return section.id;
	}

	const value = getValueAtJsonPointer<unknown>(currentData, path) ?? getValueAtJsonPointer<unknown>(snapshotData, path);
	if (value && typeof value === "object" && "id" in value && typeof (value as { id?: unknown }).id === "string") {
		return (value as { id: string }).id;
	}

	return null;
}

function getCustomSectionIdForOperation(
	operation: JsonPatchOperation,
	currentData: ResumeData,
	snapshotData: ResumeData,
): string | null {
	const fromData = getCustomSectionIdFromPath(operation.path, currentData, snapshotData);
	if (fromData) return fromData;

	if (
		operation.op === "add" &&
		operation.path.endsWith("/-") &&
		typeof operation.value === "object" &&
		operation.value !== null &&
		"id" in operation.value &&
		typeof (operation.value as { id?: unknown }).id === "string"
	) {
		return (operation.value as { id: string }).id;
	}

	return null;
}

export function getCustomSectionId(operation: JsonPatchOperation, data: ResumeData | undefined | null): string | null {
	return getCustomSectionIdForOperation(operation, data ?? ({} as ResumeData), data ?? ({} as ResumeData));
}

export function getAffectedPreviewSectionIds(
	operations: JsonPatchOperation[],
	snapshotData?: ResumeData | null,
): Set<string> {
	const sectionIds = new Set<string>();

	for (const operation of operations) {
		const section = getAffectedSectionFromPath(operation.path);
		if (!section) continue;

		if (section === "custom") {
			const customSectionId = snapshotData
				? getCustomSectionIdForOperation(operation, snapshotData, snapshotData)
				: getCustomSectionId(operation, snapshotData);
			if (customSectionId) sectionIds.add(customSectionId);
			else for (const customSection of snapshotData?.customSections ?? []) sectionIds.add(customSection.id);
			continue;
		}

		sectionIds.add(section === "picture" ? "basics" : section);
	}

	return sectionIds;
}

export function getAffectedSections(operations: JsonPatchOperation[]): Set<LeftSidebarSection> {
	const sections = new Set<LeftSidebarSection>();

	for (const operation of operations) {
		const section = getAffectedSectionFromPath(operation.path);
		if (section) sections.add(section);

		if ("from" in operation && typeof operation.from === "string") {
			const fromSection = getAffectedSectionFromPath(operation.from);
			if (fromSection) sections.add(fromSection);
		}
	}

	return sections;
}

export function getSectionValueFromResumeData(
	data: ResumeData | undefined | null,
	section: LeftSidebarSection,
): unknown {
	if (!data) return undefined;
	if (section === "ai-review") return undefined;
	if (section === "custom") return data.customSections;
	if (section === "picture" || section === "basics" || section === "summary") {
		return data[section];
	}
	return data.sections[section];
}

function valuesEqual(a: unknown, b: unknown): boolean {
	if (a === b) return true;
	if (a === null || b === null) return a === b;
	if (typeof a !== typeof b) return false;
	if (typeof a !== "object") return false;
	if (Array.isArray(a) !== Array.isArray(b)) return false;

	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) return false;
		return a.every((value, index) => valuesEqual(value, b[index]));
	}

	const aRecord = a as Record<string, unknown>;
	const bRecord = b as Record<string, unknown>;
	const aKeys = Object.keys(aRecord);
	const bKeys = Object.keys(bRecord);
	if (aKeys.length !== bKeys.length) return false;
	return aKeys.every((key) => Object.hasOwn(bRecord, key) && valuesEqual(aRecord[key], bRecord[key]));
}

function deepClone<T>(value: T): T {
	return JSON.parse(JSON.stringify(value)) as T;
}

function resolveAddTargetPath(path: string, value: unknown, currentData: ResumeData): string {
	if (!path.endsWith("/-")) return path;
	const parentPath = path.slice(0, -2);
	const parent = getValueAtJsonPointer<unknown[]>(currentData, parentPath) ?? [];
	const index = parent.findIndex((item) => valuesEqual(item, value));
	return index === -1 ? path : `${parentPath}/${index}`;
}

function getEntityPath(path: string): string {
	const segments = decodeJsonPointerPath(path);
	if (segments.length <= 1) return path;

	const last = segments[segments.length - 1];
	const previous = segments[segments.length - 2];
	const index = Number(last);
	if (!Number.isNaN(index) && (previous === "items" || previous === "roles" || previous === "customSections")) {
		return path;
	}

	return `/${segments.slice(0, -1).join("/")}`;
}

function getItemTitle(item: unknown, index: number): string {
	if (item && typeof item === "object") {
		const record = item as Record<string, unknown>;
		const titleFields = [
			"name",
			"title",
			"company",
			"school",
			"organization",
			"position",
			"network",
			"username",
			"language",
		];
		for (const field of titleFields) {
			const value = record[field];
			if (typeof value === "string" && value.trim()) return value;
		}
		const content = record.content;
		if (typeof content === "string" && content.trim()) {
			return content
				.replace(/<[^>]+>/g, "")
				.slice(0, 60)
				.trim();
		}
	}
	return t`Item ${index + 1}`;
}

function sectionTitle(type: string): string {
	if (leftSidebarSections.includes(type as LeftSidebarSection)) return getSectionTitle(type as LeftSidebarSection);
	return type;
}

function getEntityTitle(currentData: ResumeData, snapshotData: ResumeData, entityPath: string): string {
	const segments = decodeJsonPointerPath(entityPath);
	const first = segments[0];

	if (first === "basics") return getSectionTitle("basics");
	if (first === "summary") return getSectionTitle("summary");
	if (first === "picture") return getSectionTitle("picture");

	if (first === "sections") {
		const sectionType = segments[1];
		const index =
			segments[3] !== undefined && (segments[2] === "items" || segments[2] === "roles")
				? Number(segments[3])
				: undefined;
		if (index !== undefined && !Number.isNaN(index)) {
			const item =
				getValueAtJsonPointer<Record<string, unknown>>(currentData, entityPath) ??
				getValueAtJsonPointer<Record<string, unknown>>(snapshotData, entityPath);
			return getItemTitle(item, index);
		}
		return sectionTitle(sectionType ?? "");
	}

	if (first === "customSections") {
		const index = Number(segments[1]);
		if (!Number.isNaN(index)) {
			const itemIndex = segments[3] !== undefined && segments[2] === "items" ? Number(segments[3]) : undefined;
			if (itemIndex !== undefined && !Number.isNaN(itemIndex)) {
				const item =
					getValueAtJsonPointer<Record<string, unknown>>(currentData, entityPath) ??
					getValueAtJsonPointer<Record<string, unknown>>(snapshotData, entityPath);
				return getItemTitle(item, itemIndex);
			}
			const customSection =
				getValueAtJsonPointer<{ title?: string }>(currentData, entityPath) ??
				getValueAtJsonPointer<{ title?: string }>(snapshotData, entityPath);
			return customSection?.title ?? t`Custom Section ${index + 1}`;
		}
	}

	return getSectionTitle("custom");
}

const FIELD_LABEL_MAP: Record<string, () => string> = {
	name: () => t`Name`,
	title: () => t`Title`,
	content: () => t`Content`,
	description: () => t`Description`,
	summary: () => t`Summary`,
	company: () => t`Company`,
	school: () => t`School`,
	organization: () => t`Organization`,
	position: () => t`Position`,
	period: () => t`Period`,
	location: () => t`Location`,
	website: () => t`Website`,
	url: () => t`URL`,
	label: () => t`Label`,
	keywords: () => t`Keywords`,
	level: () => t`Level`,
	proficiency: () => t`Proficiency`,
	fluency: () => t`Fluency`,
	language: () => t`Language`,
	network: () => t`Network`,
	username: () => t`Username`,
	email: () => t`Email`,
	phone: () => t`Phone`,
	headline: () => t`Headline`,
	date: () => t`Date`,
	awarder: () => t`Awarder`,
	issuer: () => t`Issuer`,
	publisher: () => t`Publisher`,
	recipient: () => t`Recipient`,
	degree: () => t`Degree`,
	area: () => t`Area`,
	grade: () => t`Grade`,
	icon: () => t`Icon`,
	hidden: () => t`Hidden`,
	columns: () => t`Columns`,
	customFields: () => t`Custom Fields`,
	roles: () => t`Roles`,
	size: () => t`Size`,
	rotation: () => t`Rotation`,
	aspectRatio: () => t`Aspect Ratio`,
	borderRadius: () => t`Border Radius`,
	borderColor: () => t`Border Color`,
	borderWidth: () => t`Border Width`,
	shadowColor: () => t`Shadow Color`,
	shadowWidth: () => t`Shadow Width`,
	inlineLink: () => t`Inline Link`,
};

export function getFieldLabel(path: string): string {
	if (getEntityPath(path) === path) return t`All fields`;
	const segments = decodeJsonPointerPath(path);
	const last = segments[segments.length - 1];
	const previous = segments[segments.length - 2];
	if (last && FIELD_LABEL_MAP[last]) return FIELD_LABEL_MAP[last]();

	const index = Number(last);
	if (!Number.isNaN(index) && (previous === "items" || previous === "roles" || previous === "customSections")) {
		return t`Item ${index + 1}`;
	}
	if (last === "items" || last === "roles") return t`Items`;
	if (last === "customSections") return t`Custom Sections`;
	if (last === "-") return t`New item`;
	if (!last) return t`Value`;
	return last.charAt(0).toUpperCase() + last.slice(1);
}

export function getSectionOperations(
	operations: JsonPatchOperation[],
	sectionId: string,
	currentData: ResumeData,
	snapshotData: ResumeData,
): JsonPatchOperation[] {
	return operations.filter((operation) => {
		const section = getAffectedSectionFromPath(operation.path);
		if (!section) return false;

		if (sectionId === "custom") return section === "custom";
		if (leftSidebarSections.includes(sectionId as LeftSidebarSection) && sectionId !== "custom") {
			return section === sectionId;
		}

		if (section !== "custom") return false;
		const customId = getCustomSectionIdForOperation(operation, currentData, snapshotData);
		return customId === sectionId;
	});
}

export type SectionDiffEntry = {
	path: string;
	before: unknown;
	after: unknown;
	op: string;
};

export function getSectionDiffs(
	operations: JsonPatchOperation[],
	snapshotData: ResumeData | undefined | null,
	currentData: ResumeData | undefined | null,
	section: string,
): SectionDiffEntry[] {
	if (!snapshotData || !currentData) return [];
	const sectionOps = getSectionOperations(operations, section, currentData, snapshotData);

	return sectionOps
		.map((operation) => {
			const before = getValueAtJsonPointer(snapshotData, operation.path);
			let after: unknown;

			if (operation.op === "remove") {
				after = getValueAtJsonPointer(currentData, operation.path);
			} else if (operation.op === "add" && operation.path.endsWith("/-")) {
				after = operation.value;
			} else if (operation.op === "add" || operation.op === "replace" || operation.op === "test") {
				after = getValueAtJsonPointer(currentData, operation.path) ?? operation.value;
			} else if (operation.op === "move" || operation.op === "copy") {
				after = getValueAtJsonPointer(currentData, operation.path);
			} else {
				after = undefined;
			}

			return {
				path: operation.path,
				before,
				after,
				op: operation.op,
			};
		})
		.filter((diff) => !valuesEqual(diff.before, diff.after));
}

export type ReviewChangeGroup = {
	entityPath: string;
	title: string;
	fieldLabels: string[];
};

export function getSectionReviewGroups(
	operations: JsonPatchOperation[],
	snapshotData: ResumeData,
	currentData: ResumeData,
	sectionId: string,
): ReviewChangeGroup[] {
	const sectionOps = getSectionOperations(operations, sectionId, currentData, snapshotData);
	const groups = new Map<string, ReviewChangeGroup>();

	for (const operation of sectionOps) {
		const before = getValueAtJsonPointer(snapshotData, operation.path);
		let after: unknown;
		let resolvedPath = operation.path;

		if (operation.op === "add" && operation.path.endsWith("/-")) {
			resolvedPath = resolveAddTargetPath(operation.path, operation.value, currentData);
			after = getValueAtJsonPointer(currentData, resolvedPath) ?? operation.value;
		} else if (operation.op === "remove") {
			after = getValueAtJsonPointer(currentData, operation.path);
		} else if (operation.op === "add" || operation.op === "replace" || operation.op === "test") {
			after = getValueAtJsonPointer(currentData, operation.path) ?? operation.value;
		} else if (operation.op === "move" || operation.op === "copy") {
			after = getValueAtJsonPointer(currentData, operation.path);
		} else {
			after = undefined;
		}

		if (valuesEqual(before, after)) continue;

		const entityPath = getEntityPath(resolvedPath);
		const fieldLabel = getFieldLabel(resolvedPath);
		const title = getEntityTitle(currentData, snapshotData, entityPath);

		const existing = groups.get(entityPath) ?? { entityPath, title, fieldLabels: [] };
		if (!existing.fieldLabels.includes(fieldLabel)) existing.fieldLabels.push(fieldLabel);
		groups.set(entityPath, existing);
	}

	return Array.from(groups.values());
}

export function buildSectionInversePatch(
	operations: JsonPatchOperation[],
	sectionId: string,
	currentData: ResumeData,
	snapshotData: ResumeData,
): Operation[] | null {
	const sectionOps = getSectionOperations(operations, sectionId, currentData, snapshotData);
	const inverseOps: Operation[] = [];

	for (const op of sectionOps) {
		const currentValue = getValueAtJsonPointer(currentData, op.path);

		if (op.op === "replace") {
			if (!valuesEqual(currentValue, op.value)) return null;
			const before = getValueAtJsonPointer(snapshotData, op.path);
			if (before === undefined) {
				inverseOps.push({ op: "remove", path: op.path });
			} else {
				inverseOps.push({ op: "replace", path: op.path, value: deepClone(before) });
			}
		} else if (op.op === "add") {
			if (op.path.endsWith("/-")) {
				const parentPath = op.path.slice(0, -2);
				const parent = getValueAtJsonPointer<unknown[]>(currentData, parentPath) ?? [];
				const index = parent.findIndex((item) => valuesEqual(item, op.value));
				if (index === -1) return null;
				inverseOps.push({ op: "remove", path: `${parentPath}/${index}` });
			} else {
				if (!valuesEqual(currentValue, op.value)) return null;
				inverseOps.push({ op: "remove", path: op.path });
			}
		} else if (op.op === "remove") {
			if (currentValue !== undefined) return null;
			const before = getValueAtJsonPointer(snapshotData, op.path);
			if (before === undefined) return null;
			inverseOps.push({ op: "add", path: op.path, value: deepClone(before) });
		} else {
			return null;
		}
	}

	return inverseOps;
}

export function aiChangedSectionClassName(changed: boolean): string {
	if (!changed) return "";
	return "border-l-4 border-green-500 bg-green-50/50 dark:border-green-400 dark:bg-green-950/20 transition-colors duration-300";
}
