import { notFound } from "next/navigation";
import { BRAND } from "@/config/brand";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { RepoView } from "@/components/repo/RepoView";
import { isOwner, isRepoName } from "@/lib/github";
import { pageMeta } from "@/lib/seo";

type Props = { params: Promise<{ owner: string; name: string }> };

export async function generateMetadata({ params }: Props) {
  const { owner, name } = await params;
  const ok = isOwner(owner) && isRepoName(name);
  return pageMeta({
    path: `/repo/${owner}/${name}`,
    title: ok ? `${owner}/${name} | ${BRAND.name}` : `Repository | ${BRAND.name}`,
    description: `Commits, pull requests, contributors, open tasks and contribution records for ${ok ? `${owner}/${name}` : "a public GitHub repository"}, read live in ${BRAND.name}.`,
    noindex: true,
  });
}

export default async function RepoPage({ params }: Props) {
  const { owner, name } = await params;
  if (!isOwner(owner) || !isRepoName(name)) notFound();
  return (
    <>
      <SiteHeader />
      <main id="main" className="cm-wrap pb-24">
        <RepoView owner={owner} name={name} />
      </main>
      <SiteFooter />
    </>
  );
}
