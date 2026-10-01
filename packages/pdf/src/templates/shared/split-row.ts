export const hasSplitRowText = (value: string | undefined): value is string => {
	return typeof value === "string" && value.trim().length > 0;
};

type SplitRowContent = { top: string; bottom: string };

export const promoteSplitRowRight = ({ top, bottom }: SplitRowContent): SplitRowContent => {
	if (hasSplitRowText(top)) return { top, bottom: hasSplitRowText(bottom) ? bottom : "" };

	return { top: hasSplitRowText(bottom) ? bottom : "", bottom: "" };
};

type EducationSplitRowContent = {
	degree: string;
	grade: string;
	area: string;
	location: string;
	period: string;
};

export const getEducationSplitRowContent = ({ degree, grade, area, location, period }: EducationSplitRowContent) => {
	const degreeAndGrade = [degree, grade].filter(hasSplitRowText).join(" • ");
	const areaAndLocation = [area, location].filter(hasSplitRowText).join(" • ");
	const { top, bottom } = promoteSplitRowRight({ top: degreeAndGrade, bottom: period });

	return {
		topRight: top,
		bottomLeft: areaAndLocation,
		bottomRight: bottom,
	};
};
