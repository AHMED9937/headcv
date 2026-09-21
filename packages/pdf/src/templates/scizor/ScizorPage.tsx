import type { Style } from "@react-pdf/types";
import type { TemplatePageProps } from "../../document";
import type { TemplateColorRoles, TemplateStyleContext, TemplateStyleSlots } from "../shared/types";
import { useMemo } from "react";
import { rgbaStringToHex } from "@headcv/utils/color";
import { useRender } from "../../context";
import { Image, Page, StyleSheet, View } from "../../renderer";
import { CustomFieldContactItem, WebsiteContactItem } from "../shared/contact-item";
import { TemplateProvider } from "../shared/context";
import { filterSections } from "../shared/filtering";
import { getTemplateMetrics } from "../shared/metrics";
import { getTemplatePageMinHeightStyle, getTemplatePageSize } from "../shared/page-size";
import { hasTemplatePicture } from "../shared/picture";
import { Heading, Icon, Link, Text } from "../shared/primitives";
import { createRtlStyleHelpers } from "../shared/rtl";
import { PreviewSectionMarker, Section } from "../shared/sections";
import { composeStyles, getReadableSmallTextSize, headerNameLineHeight } from "../shared/styles";
import { SCIZOR_VISUAL_CONTRACT } from "./visual-contract";

type ScizorStyles = Omit<TemplateStyleSlots, "page"> & {
	page: Style;
	header: Style;
	headerIdentity: Style;
	headerTitleRow: Style;
	headerName: Style;
	headerHeadline: Style;
	headerContactRow: Style;
	headerContactItem: Style;
	picture: Style;
	sections: Style;
};

type ScizorTemplate = {
	colors: TemplateColorRoles;
	styles: ScizorStyles;
};

export const ScizorPage = ({ page, pageIndex }: TemplatePageProps) => {
	const data = useRender();
	const { metadata } = data;
	const { colors, styles } = useScizorTemplate();
	const metrics = getTemplateMetrics(metadata.page);
	const pageSize = getTemplatePageSize(metadata.page.format);
	const pageMinHeightStyle = getTemplatePageMinHeightStyle(metadata.page.format);
	const showHeader = pageIndex === 0;
	const mainSections = filterSections(page.main, data);
	const sidebarSections = page.fullWidth ? [] : filterSections(page.sidebar, data);
	const sections = [...mainSections, ...sidebarSections];

	return (
		<Page size={pageSize} style={composeStyles(styles.page, pageMinHeightStyle)}>
			<TemplateProvider
				styles={styles}
				colors={colors}
				features={{
					dateRailItemLayout: true,
					executiveCompactSections: true,
					executiveSectionGrids: true,
					forceCircleLevelDisplay: true,
					keepSectionItemsTogether: true,
					sectionHeadingRuleBelow: true,
				}}
			>
				{showHeader && <Header styles={styles} />}

				<View style={composeStyles(styles.sections, { rowGap: metrics.gapY(1.1) })}>
					{sections.map((section) => (
						<Section key={section} section={section} placement="main" />
					))}
				</View>
			</TemplateProvider>
		</Page>
	);
};

const Header = ({ styles }: { styles: ScizorStyles }) => {
	const { basics, picture } = useRender();
	const hasPicture = hasTemplatePicture(picture);

	return (
		<View style={styles.header}>
			<PreviewSectionMarker sectionId="basics" />
			<View style={styles.headerIdentity}>
				<View style={styles.headerTitleRow}>
					<Heading style={styles.headerName}>{basics.name}</Heading>
					{basics.headline && <Text style={styles.headerHeadline}>{basics.headline}</Text>}
				</View>

				<View style={styles.headerContactRow}>
					{basics.location && (
						<View style={styles.headerContactItem}>
							<Icon name="map-pin" />
							<Text>{basics.location}</Text>
						</View>
					)}
					{basics.email && (
						<Link src={`mailto:${basics.email}`} style={styles.headerContactItem}>
							<Icon name="envelope" />
							<Text>{basics.email}</Text>
						</Link>
					)}
					{basics.phone && (
						<Link src={`tel:${basics.phone}`} style={styles.headerContactItem}>
							<Icon name="phone" />
							<Text>{basics.phone}</Text>
						</Link>
					)}
					<WebsiteContactItem website={basics.website} style={styles.headerContactItem} />
					{basics.customFields.map((field) => (
						<CustomFieldContactItem key={field.id} field={field} style={styles.headerContactItem} />
					))}
				</View>
			</View>

			{hasPicture && <Image src={picture.url} style={styles.picture} />}
		</View>
	);
};

const useScizorTemplate = (): ScizorTemplate => {
	const { picture, metadata, rtl } = useRender();

	return useMemo(() => {
		const r = createRtlStyleHelpers(rtl);
		const foreground = rgbaStringToHex(metadata.design.colors.text);
		const background = rgbaStringToHex(metadata.design.colors.background);
		const primary = rgbaStringToHex(metadata.design.colors.primary);
		const colors: TemplateColorRoles = { foreground, background, primary };
		const metrics = getTemplateMetrics(metadata.page);
		const contactFontSize = getReadableSmallTextSize(
			metadata.typography.body.fontSize * SCIZOR_VISUAL_CONTRACT.contactTextScale,
		);
		const bodyText = {
			fontFamily: metadata.typography.body.fontFamily,
			fontSize: metadata.typography.body.fontSize,
			fontWeight: metadata.typography.body.fontWeights[0] ?? "400",
			lineHeight: metadata.typography.body.lineHeight,
			color: foreground,
			...r.text,
		} satisfies Style;

		const baseStyles = StyleSheet.create({
			page: {
				color: foreground,
				backgroundColor: background,
				paddingHorizontal: metrics.page.paddingHorizontal,
				paddingVertical: metrics.page.paddingVertical,
				rowGap: metrics.sectionGap,
				fontFamily: metadata.typography.body.fontFamily,
				fontSize: metadata.typography.body.fontSize,
				lineHeight: metadata.typography.body.lineHeight,
				direction: r.pageDirection,
			},
			text: bodyText,
			heading: {
				fontFamily: metadata.typography.heading.fontFamily,
				fontSize: metadata.typography.heading.fontSize,
				fontWeight: metadata.typography.heading.fontWeights.at(-1) ?? "700",
				lineHeight: metadata.typography.heading.lineHeight,
				color: foreground,
				...r.text,
			},
			div: {
				rowGap: metrics.gapY(0.125),
				columnGap: metrics.gapX(1 / 3),
			},
			inline: {
				flexDirection: r.row,
				alignItems: "center",
				columnGap: metrics.gapX(1 / 3),
			},
			link: {
				textDecoration: "none",
				color: foreground,
			},
			small: {
				fontSize: metadata.typography.body.fontSize * 0.875,
			},
			bold: {
				fontWeight: metadata.typography.body.fontWeights.at(-1) ?? "700",
				color: foreground,
			},
			richParagraph: {
				margin: 0,
				...bodyText,
			},
			richListItemRow: {
				flexDirection: "row",
				columnGap: metrics.gapX(1 / 3),
				alignItems: "flex-start",
			},
			richListItemMarker: {
				...bodyText,
				width: metadata.typography.body.fontSize,
				textAlign: r.listMarkerTextAlign,
			},
			richListItemContent: {
				...bodyText,
				flex: 1,
				lineHeight: metadata.typography.body.lineHeight * 0.5,
			},
			splitRow: {
				flexDirection: r.row,
				flexWrap: "wrap",
				alignItems: "flex-start",
				justifyContent: "space-between",
				columnGap: metrics.gapX(2 / 3),
			},
			section: {
				flexDirection: "column",
				rowGap: metrics.gapY(0.35),
			},
			sectionHeadingContainer: {
				flexDirection: "column",
				alignItems: "stretch",
				paddingBottom: metrics.gapY(0.08),
				borderBottomWidth: SCIZOR_VISUAL_CONTRACT.sectionRuleWidth,
				borderBottomColor: foreground,
			},
			sectionHeading: {
				color: foreground,
				fontSize: metadata.typography.heading.fontSize * SCIZOR_VISUAL_CONTRACT.sectionHeadingScale,
				fontWeight: metadata.typography.heading.fontWeights.at(-1) ?? "700",
			},
			sectionHeadingRule: {
				width: "100%",
				borderBottomWidth: SCIZOR_VISUAL_CONTRACT.sectionRuleWidth,
				borderBottomColor: foreground,
			},
			sectionItems: {
				rowGap: metrics.itemGapY,
			},
			item: {
				rowGap: metrics.gapY(0.2),
			},
			levelContainer: {
				width: "100%",
			},
			levelItem: {
				borderColor: primary,
			},
			levelItemActive: {
				backgroundColor: primary,
			},
			header: {
				flexDirection: r.row,
				alignItems: "flex-start",
				columnGap: metrics.gapX(1),
			},
			headerIdentity: {
				flex: 1,
				...r.headerIdentity,
				rowGap: metrics.gapY(0.35),
			},
			headerTitleRow: {
				flexDirection: r.row,
				alignItems: "baseline",
				flexWrap: "wrap",
				columnGap: metrics.gapX(1),
				rowGap: metrics.gapY(0.1),
			},
			headerName: {
				color: foreground,
				fontSize: metadata.typography.heading.fontSize * SCIZOR_VISUAL_CONTRACT.headerNameScale,
				lineHeight: headerNameLineHeight,
			},
			headerHeadline: {
				color: foreground,
				fontFamily: metadata.typography.heading.fontFamily,
				fontSize: metadata.typography.body.fontSize * SCIZOR_VISUAL_CONTRACT.headerHeadlineScale,
				fontStyle: "italic",
			},
			headerContactRow: {
				flexDirection: r.row,
				flexWrap: "wrap",
				rowGap: metrics.gapY(0.2),
				columnGap: metrics.gapX(0.75),
				marginTop: metrics.gapY(0.2),
			},
			headerContactItem: {
				flexDirection: r.row,
				alignItems: "center",
				width: "48%",
				columnGap: metrics.gapX(0.2),
				color: foreground,
				fontSize: contactFontSize,
			},
			picture: {
				width: picture.size,
				height: picture.size,
				objectFit: "cover",
				aspectRatio: picture.aspectRatio,
				borderRadius: picture.borderRadius,
				borderColor: rgbaStringToHex(picture.borderColor),
				borderWidth: picture.borderWidth,
				shadowColor: rgbaStringToHex(picture.shadowColor),
				shadowWidth: picture.shadowWidth,
				transform: `rotate(${picture.rotation}deg)`,
			},
			sections: {
				flexDirection: "column",
			},
			dateRailRow: {
				flexDirection: r.row,
				alignItems: "flex-start",
				columnGap: metrics.gapX(1),
			},
			dateRailMeta: {
				width: SCIZOR_VISUAL_CONTRACT.dateRailWidth,
				flexShrink: 0,
				rowGap: metrics.gapY(0.1),
			},
			dateRailContent: {
				flex: 1,
				rowGap: metrics.gapY(0.2),
			},
			dateRailSecondary: {
				fontFamily: metadata.typography.heading.fontFamily,
				fontStyle: "italic",
			},
			compactItemRow: {
				flexDirection: r.row,
				alignItems: "center",
				justifyContent: "space-between",
				columnGap: metrics.gapX(0.5),
			},
			compactItemLabel: {
				flex: 1,
				minWidth: 0,
			},
			alignEnd: {
				...r.alignEnd,
				maxWidth: "34%",
				fontSize: contactFontSize,
			},
		});

		const accentFor = ({ colors }: TemplateStyleContext) => colors.foreground;

		return {
			colors,
			styles: {
				...baseStyles,
				page: baseStyles.page,
				levelItem: (context) => ({ borderColor: accentFor(context) }),
				levelItemActive: (context) => ({ backgroundColor: accentFor(context) }),
				icon: (context) => ({
					display: metadata.page.hideIcons ? "none" : "flex",
					size: metadata.typography.body.fontSize,
					color: accentFor(context),
				}),
			} satisfies ScizorStyles,
		};
	}, [picture, metadata, rtl]);
};
