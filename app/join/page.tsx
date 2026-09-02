import { JoinForm } from "./join-form";

export default function JoinPage() {
  return (
    <div className="page shell auth-page">
      <div className="join-auth-layout">
        <header className="join-auth-heading">
          <p className="eyebrow">Create your account</p>
          <h1>Join the network.</h1>
          <p className="lede">Create your Bridge account to connect with verified cannabis businesses, retailers, brands, and industry professionals.</p>
        </header>
        <JoinForm />
      </div>
    </div>
  );
}
