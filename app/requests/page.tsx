import { DirectoryRequestInbox } from "@/components/DirectoryRequests";

export default function RequestsPage() {
  return <main className="page shell"><header className="page-heading"><p className="eyebrow">Your connections</p><h1>Request inbox</h1><p>Keep track of introductions and help keep Bridge listings accurate.</p></header><DirectoryRequestInbox /></main>;
}
