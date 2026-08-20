import Link from "next/link";
import { ProfileCard } from "@/components/ProfileCard";
import { profiles } from "@/lib/data";

export default function Home() {
  return (
    <>
      <section className="home-hero">
        <div className="hero shell hero-compact">
          <div className="hero-copy">
            <p className="eyebrow">Verified cannabis industry network</p>
            <h1 className="home-title">The cannabis industry, connected.</h1>
            <p className="lede">
              Bridge brings brands, dispensaries, cultivators, sales teams, and service partners into one trusted network. Discover businesses, follow market activity, and reach the right people faster.
            </p>
            <div className="button-row hero-actions">
              <Link className="button primary" href="/explore">Explore verified businesses</Link>
              <Link className="hero-secondary-link" href="/community">
                View community news <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="home-audience" aria-label="Who Bridge is for">
              <span>Built for</span>
              <strong>Brands</strong>
              <strong>Dispensaries</strong>
              <strong>Cultivators</strong>
              <strong>Sales teams</strong>
              <strong>Service partners</strong>
            </div>
            <p className="form-hint home-hint">Review prototype with illustrative sample data.</p>
          </div>

          <div className="network-preview" aria-label="Illustrative Bridge network activity">
            <div className="network-preview-heading">
              <div>
                <span className="network-live"><i aria-hidden="true" /> Network preview</span>
                <h2>Find your next cannabis connection.</h2>
              </div>
              <span className="preview-note">Sample data</span>
            </div>
            <div className="network-activity">
              {profiles.slice(0, 3).map((profile) => (
                <Link className="network-activity-row" href={`/profile/${profile.slug}`} key={profile.slug}>
                  <span className="avatar" aria-hidden="true">{profile.initials}</span>
                  <span className="network-identity">
                    <small>{profile.role}</small>
                    <strong>{profile.name}</strong>
                    <span>{profile.location}</span>
                  </span>
                  <span className="network-action">View <span aria-hidden="true">→</span></span>
                </Link>
              ))}
            </div>
            <Link className="network-preview-footer" href="/explore">
              Search by market, business type, specialty, and verification status
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="section shell home-path-section">
        <div className="section-heading home-path-heading">
          <div>
            <p className="eyebrow">Start with what you need</p>
            <h2>Four clear ways into Bridge.</h2>
          </div>
          <p>Explore the industry, follow current activity, publish a promotion, or manage your verified business presence.</p>
        </div>
        <div className="home-moments" aria-label="Product spaces">
          <Link className="moment-card moment-card-primary moment-card-media explore-media" href="/explore">
            <span className="moment-label">Explore</span>
            <strong>Find cannabis businesses nationwide</strong>
            <span className="muted">Search markets, roles, specialties, and verification status</span>
          </Link>
          <Link className="moment-card moment-card-media community-media" href="/community">
            <span className="moment-label">Community News</span>
            <strong>See what the industry is doing now</strong>
            <span className="muted">Follow new products, promotions, events, and announcements</span>
          </Link>
          <Link className="moment-card" href="/create">
            <span className="moment-label">Create</span>
            <strong>Publish a targeted promotion</strong>
            <span className="muted">Choose the right audience and protect business details</span>
          </Link>
          <Link className="moment-card" href="/my-profile">
            <span className="moment-label">My Profile</span>
            <strong>Keep your business easy to reach</strong>
            <span className="muted">Manage public information and verified business contacts</span>
          </Link>
        </div>
      </section>

      <section className="section shell">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Inside the network</p>
            <h2>Meet cannabis businesses across the country.</h2>
          </div>
          <Link className="text-link" href="/explore">Explore the directory <span aria-hidden="true">→</span></Link>
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
              <p className="eyebrow">Built for cannabis business</p>
              <h2>Discovery with the right information and the right boundaries.</h2>
            </div>
          </div>
          <div className="value-grid">
            <article>
              <span className="number">01</span>
              <h3>Know who you are meeting</h3>
              <p>Verification and business roles make every profile easier to understand before you connect.</p>
            </article>
            <article>
              <span className="number">02</span>
              <h3>Share with the right audience</h3>
              <p>Public updates and protected business information stay separate by design.</p>
            </article>
            <article>
              <span className="number">03</span>
              <h3>See beyond your local market</h3>
              <p>Nationwide discovery helps the industry learn, collaborate, and grow across state lines.</p>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
