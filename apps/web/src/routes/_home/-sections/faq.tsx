import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@headcv/ui/components/accordion";
import { cn } from "@headcv/utils/style";
import { landingRowHover } from "./landing-motion";

export function FAQ() {
	const items = [
		{
			id: "how-it-works",
			question: t({ id: "home.faq.howItWorks", message: "What is HeadCV and how does it work?" }),
			answer: t({
				id: "home.faq.howItWorksText",
				message:
					"HeadCV is a free, easy-to-use online resume builder for creating professional, ATS-friendly resumes quickly. Choose from 15 professional templates, customize the layout and design, and download unlimited, watermark-free PDFs. Start from a blank resume or import an existing PDF or Microsoft Word document to prefill your content.",
			}),
		},
		{
			id: "free",
			question: t({ id: "home.faq.free", message: "Is HeadCV really free?" }),
			answer: t({
				id: "home.faq.freeText",
				message:
					"Yes. Your first resume is free forever, with unlimited watermark-free PDF downloads, access to every template, and full layout and design control. No trial or credit card is required. You only pay for optional extras such as saving multiple resume versions or using AI writing assistance.",
			}),
		},
		{
			id: "why-free",
			question: t({ id: "home.faq.whyFree", message: "Why is HeadCV free?" }),
			answer: t({
				id: "home.faq.whyFreeText",
				message:
					"HeadCV is built by a small, independent team focused on helping people worldwide get hired. Optional paid features, such as saving multiple resume versions and AI writing assistance, fund continued development while keeping the free plan generous.",
			}),
		},
		{
			id: "versions",
			question: t({ id: "home.faq.versions", message: "Can I save multiple resume versions on HeadCV?" }),
			answer: t({
				id: "home.faq.versionsText",
				message:
					"Yes. One resume is free to edit and download without limits. Upgrade to a paid plan to save multiple versions at the same time for different roles or languages. If you return to the free plan, your first resume remains editable and downloadable while additional versions stay saved but locked.",
			}),
		},
		{
			id: "privacy",
			question: t({ id: "home.faq.privacy", message: "How does HeadCV protect my data?" }),
			answer: t({
				id: "home.faq.privacyText",
				message:
					"HeadCV is privacy-first and committed to GDPR compliance. We do not sell your personal data. You own your content and can delete your account and data at any time.",
			}),
		},
		{
			id: "languages",
			question: t({ id: "home.faq.languages", message: "Does HeadCV support multiple languages?" }),
			answer: t({
				id: "home.faq.languagesText",
				message:
					"Yes. You can write your resume in multiple languages and customize section labels, date formats, and page size. HeadCV supports right-to-left layouts for languages such as Arabic and Hebrew. Upgrading lets you save and manage a separate resume version for each language.",
			}),
		},
		{
			id: "ats",
			question: t({ id: "home.faq.ats", message: "Are HeadCV resumes ATS-friendly?" }),
			answer: t({
				id: "home.faq.atsText",
				message:
					"Yes. HeadCV exports clean, text-based PDFs with embedded fonts and clear structure so applicant tracking systems can read your resume, including two-column templates. For very old systems, a one-column layout is the safest choice. Clear headings, relevant keywords, and impact-focused bullet points still matter most.",
			}),
		},
		{
			id: "import",
			question: t({ id: "home.faq.import", message: "Can I import an existing resume into HeadCV?" }),
			answer: t({
				id: "home.faq.importText",
				message:
					"Yes. Upload a PDF or Microsoft Word document and HeadCV will import its content into a clean, editable, ATS-friendly layout so you can start faster.",
			}),
		},
	];
	return (
		<section
			id="faq"
			aria-labelledby="faq-heading"
			className="scroll-mt-24 border-y bg-card px-4 py-16 sm:px-6 sm:py-24 lg:px-8"
		>
			<div className="mx-auto max-w-3xl">
				<h2 id="faq-heading" className="mb-10 text-center font-bold font-display text-3xl text-primary sm:text-4xl">
					<Trans id="home.faq.heading">Frequently asked questions</Trans>
				</h2>
				<Accordion multiple={false}>
					{items.map((item) => (
						<AccordionItem key={item.id} value={item.id} className="border-b">
							<AccordionTrigger
								className={cn(
									"-mx-3 min-h-14 gap-4 rounded-xl px-3 py-5 text-start font-semibold text-base",
									landingRowHover,
								)}
							>
								{item.question}
							</AccordionTrigger>
							<AccordionContent className="text-start text-base text-muted-foreground leading-relaxed">
								{item.answer}
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			</div>
		</section>
	);
}
