import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@headcv/ui/components/accordion";
import { cn } from "@headcv/utils/style";
import { landingRowHover } from "./landing-motion";

export function FAQ() {
	const items = [
		{
			id: "free",
			question: t({ id: "home.faq.free", message: "Is HeadCV free to use?" }),
			answer: t({
				id: "home.faq.freeText",
				message:
					"You can build, preview and download your resume for free today. Pro plans are coming soon, and no paid subscription is currently required.",
			}),
		},
		{
			id: "pdf",
			question: t({ id: "home.faq.pdf", message: "Can I export my resume to PDF?" }),
			answer: t({
				id: "home.faq.pdfText",
				message:
					"Yes. Download a PDF from the builder, then update your resume and export a new copy whenever you need.",
			}),
		},
		{
			id: "ats",
			question: t({ id: "home.faq.ats", message: "Are the templates ATS-friendly?" }),
			answer: t({
				id: "home.faq.atsText",
				message:
					"The templates use clear sections and readable text. For automated applications, choose a simple layout and follow the employer's file requirements. No template can guarantee an ATS score or an interview.",
			}),
		},
		{
			id: "import",
			question: t({ id: "home.faq.import", message: "Can I import an existing resume?" }),
			answer: t({
				id: "home.faq.importText",
				message: "Yes. Import your existing resume, then review the content and formatting before downloading.",
			}),
		},
		{
			id: "arabic",
			question: t({ id: "home.faq.arabic", message: "Can I use HeadCV in Arabic?" }),
			answer: t({
				id: "home.faq.arabicText",
				message:
					"Yes. Use the language selector to switch between Arabic and English. The interface adjusts its reading direction. Preview your resume to check its language and layout before exporting.",
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
				<Accordion>
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
