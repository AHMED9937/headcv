import type { ResumeData } from "@headcv/schema/resume/data";
import type { RouterOutput } from "@/libs/orpc/client";
import { ORPCError } from "@orpc/client";
import { createFileRoute, lazyRouteComponent, notFound, redirect } from "@tanstack/react-router";
import { orpc } from "@/libs/orpc/client";
import { createNoindexFollowMeta } from "@/libs/seo";

type LoaderData = Omit<RouterOutput["resume"]["getBySlug"], "data"> & { data: ResumeData };

const appUrl = "https://www.headcv.com";

export const Route = createFileRoute("/$username/$slug")({
	component: lazyRouteComponent(() => import("@/features/resume/public/public-resume"), "PublicResumeRoute"),
	loader: async ({ context, params }) => {
		const { username, slug } = params;
		const resume = await context.queryClient.ensureQueryData(
			orpc.resume.getBySlug.queryOptions({ input: { username, slug } }),
		);

		return { resume: resume as LoaderData };
	},
	head: ({ loaderData, params }) => {
		const resume = loaderData?.resume;
		if (!resume?.isPublic) {
			return { meta: [{ title: "Resume - HeadCV" }, createNoindexFollowMeta()] };
		}

		const name = resume.data.basics.name || resume.name || "Resume";
		const title = `${name} - HeadCV`;
		const description = resume.data.basics.headline || `View ${name}'s professional resume on HeadCV.`;
		const canonicalUrl = `${appUrl}/${params.username}/${params.slug}`;
		const ogImage = `${appUrl}/opengraph/banner.jpg`;

		return {
			title,
			links: [{ rel: "canonical", href: canonicalUrl }],
			meta: [
				{ name: "description", content: description },
				{ name: "robots", content: "index, follow" },
				{ property: "og:title", content: title },
				{ property: "og:description", content: description },
				{ property: "og:type", content: "profile" },
				{ property: "og:url", content: canonicalUrl },
				{ property: "og:image", content: ogImage },
				{ property: "og:image:width", content: "1200" },
				{ property: "og:image:height", content: "630" },
				{ property: "twitter:title", content: title },
				{ property: "twitter:description", content: description },
				{ property: "twitter:image", content: ogImage },
				{ property: "twitter:card", content: "summary_large_image" },
			],
		};
	},
	onError: (error) => {
		if (error instanceof ORPCError && error.code === "NEED_PASSWORD") {
			const data = error.data as { username?: string; slug?: string } | undefined;
			const username = data?.username;
			const slug = data?.slug;

			if (username && slug) {
				throw redirect({
					to: "/auth/resume-password",
					search: { redirect: `/${username}/${slug}` },
				});
			}
		}

		throw notFound();
	},
});
