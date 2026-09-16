import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

// Preserve the existing portraits; render all lettering and layout as vectors.
const destination = new URL("../apps/web/public/templates/svg/", import.meta.url);
mkdirSync(destination, { recursive: true });
const escapeXml = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
let parts;
function text(x, y, content, size = 20, weight = 400, color = "#17212c", family = "Arial, Helvetica, sans-serif") {
	parts.push(
		`<text x="${x}" y="${y}" xml:space="preserve" font-size="${size}" font-weight="${weight}" fill="${color}" font-family="${family}">${escapeXml(content)}</text>`,
	);
}
function lines(x, y, content, size = 20, step = 28) {
	content.forEach((line, index) => {
		text(x, y + index * step, line, size);
	});
}
function rect(x, y, width, height, fill = "#fff", stroke = "none", radius = 0) {
	parts.push(
		`<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`,
	);
}
function rule(x, y, end, color = "#6b7280") {
	parts.push(`<path d="M${x} ${y}H${end}" stroke="${color}" stroke-width="1.5"/>`);
}
function portrait(id, x, y, width, height, radius = 10) {
	const photo = readFileSync(new URL(`../apps/web/public/templates/jpg/${id}.jpg`, import.meta.url));
	parts.push(
		`<defs><clipPath id="portrait"><rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}"/></clipPath></defs><image href="data:image/jpeg;base64,${photo.toString("base64")}" width="1055" height="1491" clip-path="url(#portrait)"/>`,
	);
}
function start(name) {
	parts = [
		`<svg xmlns="http://www.w3.org/2000/svg" width="1055" height="1491" viewBox="0 0 1055 1491"><title>${escapeXml(name)} resume preview</title>`,
	];
	rect(0, 0, 1055, 1491);
}
function save(id) {
	writeFileSync(new URL(`${id}.svg`, destination), `${parts.join("\n")}\n</svg>\n`);
}

start("Aisha Rahman");
portrait("rhyhorn", 857, 25, 174, 187);
text(27, 91, "Aisha Rahman", 44, 700);
text(27, 126, "Senior Project Manager", 24);
text(27, 172, "aisha.rahman@example.com  |  +971 50 123 4567  |  Abu Dhabi, UAE  |  linkedin.com/in/aisharahman", 17);
function minimalHeading(y, label) {
	text(27, y, label, 26);
	rule(27, y + 13, 1030, "#42484d");
}
minimalHeading(262, "Professional Summary");
lines(27, 304, [
	"Senior Project Manager with 8 years of experience delivering complex technology and business transformation",
	"programs. Skilled in agile delivery, stakeholder management, and cross-functional leadership, with a proven record",
	"of driving measurable results, building high-performing teams, and aligning solutions to business goals.",
]);
minimalHeading(420, "Core Skills");
[
	["Delivery Planning", "Expert", "Roadmaps, Resourcing,", "Prioritisation"],
	["Risk Management", "Expert", "Risk Assessment,", "Mitigation, Governance"],
	["Agile", "Expert", "Scrum, Kanban,", "Continuous Improvement"],
	["Stakeholder Alignment", "Expert", "Communication,", "Influence, Relationship Building"],
].forEach(([label, ...details], index) => {
	const x = 28 + index * 258;
	text(x, 469, label, 19, 700);
	lines(x, 499, details, 17, 26);
});
minimalHeading(619, "Professional Experience");
text(27, 666, "Emirates Digital Solutions", 21, 700);
text(902, 661, "Abu Dhabi, UAE", 17);
text(27, 694, "Senior Project Manager");
text(842, 689, "January 2022 – Present", 17);
lines(
	47,
	731,
	[
		"•  Delivered a $4M transformation program to modernise customer service platforms, completing on time and",
		"    10% under budget.",
		"•  Led a cross-functional team of 25+ across technology, operations, and marketing, ensuring alignment with",
		"    strategic objectives and stakeholder needs.",
		"•  Established robust governance and reporting frameworks, improving visibility and enabling faster decision-making",
		"    across executives.",
	],
	19,
	28,
);
text(27, 925, "NexGen Consulting", 21, 700);
text(934, 923, "Dubai, UAE", 17);
text(27, 954, "Project Manager");
text(789, 951, "June 2018 – December 2022", 17);
lines(
	47,
	991,
	[
		"•  Improved on-time delivery from 78% to 94% across a portfolio of 12 projects through stronger planning,",
		"    risk management, and agile practices.",
		"•  Managed end-to-end delivery of digital initiatives for clients in finance and healthcare, with project values",
		"    ranging from $500K to $3M.",
		"•  Built and maintained strong client relationships, resulting in repeat business and a 30% increase in account growth.",
	],
	19,
	29,
);
minimalHeading(1172, "Education");
text(27, 1219, "BSc Business Management", 21, 700);
text(939, 1219, "Leeds, UK", 17);
text(27, 1248, "University of Leeds");
text(794, 1248, "September 2010 – June 2014", 17);
minimalHeading(1320, "Professional Development");
text(27, 1367, "Agile Delivery Workshop", 21, 700);
text(965, 1367, "Online", 17);
text(27, 1396, "ICAgile");
text(927, 1396, "March 2023", 17);
save("rhyhorn");

start("Rafael Costa");
portrait("pikachu", 18, 42, 358, 440, 15);
const gold = "#9b852c";
rect(391, 42, 646, 235, gold, "none", 12);
text(418, 117, "Rafael Costa", 54, 700, "#e8e2cf", "Georgia, serif");
text(418, 157, "Creative Director", 30, 400, "#ded7c1");
rule(417, 177, 1014, "#b6aa70");
text(418, 214, "rafael.costa@example.com  |  +351 912 345 678", 19, 400, "#d8d1ba");
text(418, 249, "rafaelcosta.design  |  Lisbon, Portugal", 19, 400, "#d8d1ba");
function goldHeading(x, y, end, label) {
	text(x, y, label, 27, 700, gold, "Georgia, serif");
	rule(x, y + 13, end, gold);
}
goldHeading(396, 332, 1035, "Professional Summary");
lines(
	396,
	379,
	[
		"Creative Director with 15+ years of experience leading brand and digital",
		"projects for global and local clients. Expert at uniting strategy, design and",
		"storytelling to build distinctive brands. Passionate about creating meaningful",
		"work that connects people and drives business results.",
	],
	18,
	27,
);
goldHeading(26, 528, 363, "Education");
text(26, 574, "BA (Hons) Graphic Design", 19, 700);
lines(26, 602, ["2004 – 2008", "University of São Paulo", "São Paulo, Brazil"], 19, 26);
goldHeading(396, 523, 1035, "Expertise");
lines(396, 574, ["Art Direction", "Brand Systems"], 21, 33);
lines(711, 574, ["Typography", "Creative Leadership"], 21, 33);
goldHeading(26, 723, 363, "Selected Recognition");
text(26, 769, "Studio Leadership Award", 19, 700);
lines(
	26,
	796,
	[
		"2024",
		"Lumina Creative",
		"Awarded for outstanding",
		"leadership, mentorship and",
		"contribution to studio culture.",
	],
	19,
	27,
);
goldHeading(26, 970, 363, "Languages");
text(26, 1014, "Portuguese", 19, 700);
text(26, 1040, "Native", 19);
text(26, 1077, "English", 19, 700);
text(26, 1103, "Fluent", 19);
goldHeading(26, 1170, 363, "Interests");
text(26, 1214, "Photography", 19, 700);
text(26, 1240, "Visual storytelling, travel", 18);
text(26, 1275, "Architecture", 19, 700);
text(26, 1301, "Urban design, modernism", 18);
goldHeading(396, 674, 1035, "Professional Experience");
text(397, 723, "Lumina Creative", 21, 700);
text(902, 723, "Lisbon, Portugal", 17);
text(397, 750, "Creative Director", 19);
text(829, 750, "January 2022 – Present", 17);
lines(
	414,
	795,
	[
		"•  Lead the creative vision across branding, digital and campaign work",
		"    for a diverse portfolio of clients, from startups to international brands.",
		"•  Directed 12 brand launches, consistently delivering high-quality,",
		"    award-nominated work that increased client engagement and market",
		"    presence.",
		"•  Built and mentor a creative team of 8, fostering a collaborative",
		"    culture, clear creative standards and ongoing professional growth.",
	],
	18,
	28,
);
text(397, 1036, "Atlas Studio", 21, 700);
text(914, 1036, "Porto, Portugal", 17);
text(397, 1064, "Senior Art Director", 19);
text(794, 1064, "June 2018 – December 2022", 17);
lines(
	414,
	1109,
	[
		"•  Led art direction for integrated campaigns across digital, print and",
		"    experiential, working with major clients in lifestyle, technology and",
		"    culture.",
		"•  Developed comprehensive brand systems and design guidelines",
		"    that improved consistency and efficiency across multiple touchpoints.",
		"•  Collaborated closely with strategy and product teams to create",
		"    user-centred design solutions, resulting in stronger brand affinity",
		"    and measurable business growth.",
	],
	18,
	28,
);
save("pikachu");

start("Marcus Chen");
const teal = "#087f99";
function panel(y, height, title) {
	rect(24, y, 1008, height, "#fff", "#dfe3e6", 12);
	if (title) text(48, y + 39, title, 23, 700, teal);
}
panel(37, 244);
portrait("lapras", 41, 56, 186, 207, 10);
text(248, 123, "Marcus Chen", 44, 700);
text(248, 160, "Frontend Engineer", 24);
text(248, 214, "marcus.chen@example.com  |  +65 9123 4567  |  Singapore  |  marcuschen.dev", 18);
panel(301, 157, "Professional Summary");
lines(
	48,
	375,
	[
		"Frontend engineer with 8 years of experience building scalable, user-focused web applications. Specialized",
		"in React, TypeScript and modern frontend architecture. Passionate about performance, accessibility and",
		"clean design systems that deliver engaging experiences.",
	],
	20,
	27,
);
panel(477, 211, "Technical Skills");
[
	["React", "Advanced", "Component Design,", "State Management,", "Next.js"],
	["TypeScript", "Advanced", "Type Safety,", "API Integration,", "Developer Experience"],
	["Accessibility", "Expert", "WCAG, ARIA,", "Inclusive Design,", "Semantic HTML"],
	["Performance", "Expert", "Core Web Vitals,", "Bundling, Caching,", "Rendering Optimization"],
].forEach(([label, ...details], index) => {
	const x = 48 + index * 249;
	text(x, 555, label, 22, 700);
	lines(x, 585, details, 18, 24);
	if (index) parts.push(`<path d="M${x - 18} 530V665" stroke="#dfe3e6" stroke-width="1.5"/>`);
});
panel(707, 460, "Professional Experience");
text(48, 785, "Lumen Digital", 22, 700);
text(918, 783, "Singapore", 18);
text(48, 812, "Senior Frontend Engineer", 19);
text(837, 809, "Mar 2022 – Present", 18);
lines(
	59,
	846,
	[
		"•  Led development of a new marketing platform using React and Next.js, improving page load speed by 40%",
		"    and increasing organic sign-ups by 25%.",
		"•  Collaborated with product, design and backend teams to build a scalable component library used across",
		"    multiple customer-facing products.",
	],
	19,
	27,
);
rule(48, 950, 1008, "#dfe3e6");
text(48, 990, "NovaTech Solutions", 22, 700);
text(918, 988, "Singapore", 18);
text(48, 1017, "Frontend Engineer", 19);
text(816, 1015, "Jun 2018 – Feb 2022", 18);
lines(
	59,
	1052,
	[
		"•  Built an accessible design system used across 8 products, ensuring consistent user experience and",
		"    WCAG 2.1 AA compliance.",
		"•  Developed responsive web applications with React and TypeScript, working closely with designers and",
		"    backend engineers to deliver high-quality features on time.",
	],
	19,
	27,
);
panel(1187, 126, "Education");
text(48, 1260, "National University of Singapore", 21, 700);
text(918, 1259, "Singapore", 18);
text(48, 1289, "B.Sc. in Computer Science", 19);
text(813, 1287, "Aug 2014 – May 2018", 18);
panel(1333, 126, "Certification");
text(48, 1406, "Google Professional Frontend Developer", 21, 700);
text(48, 1433, "Google", 19);
text(862, 1416, "Issued Jan 2021", 18);
save("lapras");
console.log("Built three landing previews with vector text and embedded original portraits.");
