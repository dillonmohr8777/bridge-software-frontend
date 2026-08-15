import Link from "next/link";
import { ProfileCard } from "@/components/ProfileCard";
import { profiles } from "@/lib/data";

export default function Home() {
  return (
    <>
      <section className="hero shell hero-compact">
        <div className="hero-copy">
          <p className="eyebrow">One industry · One network · One Bridge</p>
          <h1 className="home-title">Discover, publish, and connect with verified cannabis businesses.</h1>
          <p className="lede">
            Enter Community News, Create, My Profile, or Explore. Public, member, and verified-business views stay distinct.
          </p>
          <div className="button-row">
            <Link className="button primary" href="/explore">Open Explore</Link>
            <Link className="button secondary" href="/community">Community News</Link>
            <Link className="button secondary" href="/create">Create</Link>
          </div>
          <p className="form-hint home-hint">Phase 2 review prototype · provisional identity · illustrative sample data only.</p>
        </div>
        <div className="home-moments" aria-label="Product spaces">
          <Link className="moment-card moment-card-media community-media" href="/community">
            <span className="moment-label">Community News</span>
            <strong>Scan stories and signals</strong>
            <span className="muted">News grid or Classic feed</span>
          </Link>
          <Link className="moment-card" href="/create">
            <span className="moment-label">Create</span>
            <strong>Target a promotion</strong>
            <span className="muted">Multi-audience · protected detail</span>
          </Link>
          <Link className="moment-card" href="/my-profile">
            <span className="moment-label">My Profile</span>
            <strong>Business home base</strong>
            <span className="muted">Public vs B2B · contacts</span>
          </Link>
          <Link className="moment-card moment-card-media explore-media" href="/explore">
            <span className="moment-label">Explore</span>
            <strong>Nationwide discovery</strong>
            <span className="muted">Filters · favorites · honest coverage</span>
          </Link>
        </div>
      </section>
      <section className="section shell">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Featured members</p>
            <h2>Illustrative network sample</h2>
          </div>
          <Link className="text-link" href="/explore">Browse Explore <span aria-hidden="true">→</span></Link>
        </div>
        <div className="card-grid">
          {profiles.slice(0, 3).map((profile) => (
            <ProfileCard key={profile.slug} profile={profile} />
          ))}
        </div>
      </section>
      <section className="section value-section">
        <div className="shell">
          <div className="section-heading narrow">
            <div>
              <p className="eyebrow">Product principles</p>
              <h2>Trust before reach. Permission before introduction.</h2>
            </div>
          </div>
          <div className="value-grid">
            <article>
              <span className="number">01</span>
              <h3>Role-aware visibility</h3>
              <p>Public, member, and EIN-verified business fields stay separate by design.</p>
            </article>
            <article>
              <span className="number">02</span>
              <h3>Protected detail guard</h3>
              <p>Wholesale and business-only content cannot target Adults 21+ in Create.</p>
            </article>
            <article>
              <span className="number">03</span>
              <h3>Honest coverage</h3>
              <p>Nationwide filters are available; sample records span a limited set of states.</p>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
