const productionRootUrl = "https://headcv.com/";
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
	const appImage = `${canonicalUrl}opengraph/banner.jpg`;
	return [
		{
			"@context": "https://schema.org",
			"@type": "WebSite",
			"@id": `${canonicalUrl}#website`,
			name: appName,
			url: canonicalUrl,
			inLanguage: locale,
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
			image: appImage,
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

const homeFaqJsonLdItems = [
	{
		question: "Is HeadCV free to use?",
		answer:
			"Yes. You can create and preview a CV for free without creating an account. Saving multiple CVs or syncing across devices will require a free account in the future, and some advanced features may become part of a paid plan.",
	},
	{
		question: "Do I need to sign up before building my CV?",
		answer:
			"No. You can start building your CV immediately as a guest. We only ask you to create an account after you have seen the preview or want to save your work.",
	},
	{
		question: "Is my data safe?",
		answer:
			"Yes. Your CV content is stored securely, and we do not sell or share your personal information with third parties. You can delete your account and data at any time.",
	},
	{
		question: "Can I export my CV to PDF?",
		answer: "Yes. You can download a professional, ATS-friendly PDF of your CV once you are happy with the preview.",
	},
	{
		question: "Is HeadCV available in Arabic?",
		answer:
			"Yes. HeadCV supports both English (left-to-right) and Arabic (right-to-left) layouts, with templates designed for each direction.",
	},
	{
		question: "Does HeadCV use AI to write my CV?",
		answer:
			"HeadCV can use AI-assisted tools when you choose to enable and configure them; the core editor and templates remain usable without AI.",
	},
] as const;
