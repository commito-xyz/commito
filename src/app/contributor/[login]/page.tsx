import { notFound } from "next/navigation";
import { BRAND } from "@/config/brand";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Profile } from "@/components/people/Profile";
import { isLogin } from "@/lib/github";
import { pageMeta } from "@/lib/seo";

type Props = { params: Promise<{ login: string }> };

export async function generateMetadata({ params }: Props) {
  const { login } = await params;
  return pageMeta({
    path: `/contributor/${login}`,
    title: `${isLogin(login) ? login : "Contributor"} | ${BRAND.name}`,
    description: `Public GitHub profile, recent repositories and contributions in your hub for ${isLogin(login) ? login : "a contributor"}, read live in ${BRAND.name}.`,
    noindex: true,
  });
}

export default async function ContributorPage({ params }: Props) {
  const { login } = await params;
  if (!isLogin(login)) notFound();
  return (
    <>
      <SiteHeader />
      <main id="main" className="cm-wrap pb-24">
        <Profile login={login} />
      </main>
      <SiteFooter active="/contributors" />
    </>
  );
}
