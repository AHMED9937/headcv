const productionRootUrl = "https://www.headcv.com/";
const appName = "HeadCV";

// TODO(Q9): Replace with the final product domain and repository URL once decided.
const repositoryUrl = "https://github.com/AHMED9937/headcv";

type JsonLd = Record<string, unknown>;

export const getCanonicalRootUrl = (origin?: string): string => {
	if (!origin) return productionRootUrl;

	const url = new URL(origin);
	url.pathname = "/";
	url.search = "";
	url.hash = "";

	return url.toString();
};

export const createNoindexFollowMeta = () => ({ name: "robots", content: "noindex, follow" });

const serializeJsonLdForScript = (data: JsonLd) =>
	JSON.stringify(data).replace(/[<>&\u2028\u2029]/g, (character) => {
		switch (character) {
			case "<":
				return "\\u003C";
			case ">":
				return "\\u003E";
			case "&":
				return "\\u0026";
			case "\u2028":
				return "\\u2028";
			case "\u2029":
				return "\\u2029";
			default:
				return character;
		}
	});

const createStructuredDataScript = (id: string, data: JsonLd) => ({
	id,
	type: "application/ld+json",
	children: serializeJsonLdForScript(data),
});

export const getRootStructuredData = (canonicalUrl: string, locale = "en"): JsonLd[] => {
	const appLogo = `${canonicalUrl}brand/headcv-mark.png`;
	const appBanner = `${canonicalUrl}opengraph/banner.jpg`;
	const organizationId = `${canonicalUrl}#organization`;

	return [
		{
			"@context": "https://schema.org",
			"@type": "Organization",
			"@id": organizationId,
			name: appName,
			url: canonicalUrl,
			logo: appLogo,
			image: appLogo,
			sameAs: [repositoryUrl],
		},
		{
			"@context": "https://schema.org",
			"@type": "WebSite",
			"@id": `${canonicalUrl}#website`,
			name: appName,
			url: canonicalUrl,
			inLanguage: locale,
			publisher: { "@id": organizationId },
		},
		{
			"@context": "https://schema.org",
			"@type": ["SoftwareApplication", "WebApplication"],
			"@id": `${canonicalUrl}#software`,
			name: appName,
			url: canonicalUrl,
			description:
				"HeadCV is a guided CV builder that helps job seekers create ATS-friendly resumes with curated phrasing, expert structure, and a live preview. Free to start; account required only to save multiple CVs.",
			applicationCategory: "BusinessApplication",
			operatingSystem: "Web",
			isAccessibleForFree: true,
			image: appLogo,
			screenshot: appBanner,
			inLanguage: locale,
			offers: {
				"@type": "Offer",
				price: "0",
				priceCurrency: "USD",
				availability: "https://schema.org/InStock",
				description: "Core CV builder is free to use. Accounts and paid tiers may be introduced later.",
			},
			codeRepository: repositoryUrl,
		},
		{
			"@context": "https://schema.org",
			"@type": "Project",
			"@id": `${canonicalUrl}#project`,
			name: appName,
			url: canonicalUrl,
			image: appLogo,
			sameAs: [repositoryUrl],
		},
		{
			"@context": "https://schema.org",
			"@type": "FAQPage",
			"@id": `${canonicalUrl}#faq`,
			mainEntity: homeFaqJsonLdItems.map((item) => ({
				"@type": "Question",
				name: item.question,
				acceptedAnswer: {
					"@type": "Answer",
					text: item.answer,
				},
			})),
		},
	];
};

export const createRootStructuredDataScript = (canonicalUrl: string, locale = "en") =>
	createStructuredDataScript("headcv-structured-data", {
		"@context": "https://schema.org",
		"@graph": getRootStructuredData(canonicalUrl, locale),
	});

export const createTemplateGalleryStructuredDataScript = (canonicalUrl: string, rootUrl: string, locale = "en") =>
	createStructuredDataScript("headcv-template-gallery-structured-data", {
		"@context": "https://schema.org",
		"@graph": [
			{
				"@type": "CollectionPage",
				"@id": `${canonicalUrl}#collection`,
				name: "Resume Templates",
				url: canonicalUrl,
				description: "Browse free ATS-friendly, modern, professional, and creative resume templates on HeadCV.",
				inLanguage: locale,
				isPartOf: { "@id": `${rootUrl}#website` },
				about: "Resume and CV design templates",
			},
		],
	});

const homeFaqJsonLdItems = [
	{
		question: "What is HeadCV and how does it work?",
		answer:
			"HeadCV is a free, easy-to-use online resume builder for creating professional, ATS-friendly resumes quickly. Choose from 15 professional templates, customize the layout and design, and download unlimited, watermark-free PDFs. Start from a blank resume or import an existing PDF or Microsoft Word document to prefill your content.",
	},
	{
		question: "Is HeadCV really free?",
		answer:
			"Yes. Your first resume is free forever, with unlimited watermark-free PDF downloads, access to every template, and full layout and design control. No trial or credit card is required. You only pay for optional extras such as saving multiple resume versions or using AI writing assistance.",
	},
	{
		question: "Why is HeadCV free?",
		answer:
			"HeadCV is built by a small, independent team focused on helping people worldwide get hired. Optional paid features, such as saving multiple resume versions and AI writing assistance, fund continued development while keeping the free plan generous.",
	},
	{
		question: "Can I save multiple resume versions on HeadCV?",
		answer:
			"Yes. One resume is free to edit and download without limits. Upgrade to a paid plan to save multiple versions at the same time for different roles or languages. If you return to the free plan, your first resume remains editable and downloadable while additional versions stay saved but locked.",
	},
	{
		question: "How does HeadCV protect my data?",
		answer:
			"HeadCV is privacy-first and committed to GDPR compliance. We do not sell your personal data. You own your content and can delete your account and data at any time.",
	},
	{
		question: "Does HeadCV support multiple languages?",
		answer:
			"Yes. You can write your resume in multiple languages and customize section labels, date formats, and page size. HeadCV supports right-to-left layouts for languages such as Arabic and Hebrew. Upgrading lets you save and manage a separate resume version for each language.",
	},
	{
		question: "Are HeadCV resumes ATS-friendly?",
		answer:
			"Yes. HeadCV exports clean, text-based PDFs with embedded fonts and clear structure so applicant tracking systems can read your resume, including two-column templates. For very old systems, a one-column layout is the safest choice. Clear headings, relevant keywords, and impact-focused bullet points still matter most.",
	},
	{
		question: "Can I import an existing resume into HeadCV?",
		answer:
			"Yes. Upload a PDF or Microsoft Word document and HeadCV will import its content into a clean, editable, ATS-friendly layout so you can start faster.",
	},
] as const;
