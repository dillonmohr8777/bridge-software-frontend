"use client";

import { useMemo, useState } from "react";
import { RouteState } from "@/components/RouteState";

// Fictional sample queue for the discovery prototype. There is no live queue endpoint:
// the paginated case list, case detail, and decision actions are Human Gate B / Miraj work
// (docs/INTEGRATION-API-CONTRACT.md, "Admin verification queue"). Nothing here is invented
// backend behaviour — the states below are exercised against the sample data.
type QueueItem = {
  name: string;
  role: string;
  market: string;
  status: string;
  waitingDays: number;
};

const queue: QueueItem[] = [
  { name: "Northstar Sales Group", role: "Sales rep", market: "Illinois", status: "EIN received", waitingDays: 1 },
  { name: "Union Street Collective", role: "Dispensary", market: "Massachusetts", status: "License mismatch", waitingDays: 2 },
  { name: "Sunroom Wellness", role: "Brand", market: "New York", status: "Ready for review", waitingDays: 3 },
  { name: "Coastal Buyers Co.", role: "Retailer", market: "California", status: "Documents missing", waitingDays: 4 },
];

const needsAttention = (status: string) => status.includes("mismatch") || status.includes("missing");

const filters = [
  { id: "all", label: "All cases" },
  { id: "attention", label: "Needs attention" },
  { id: "ready", label: "Ready for review" },
  { id: "expired", label: "Expired evidence" },
] as const;

type FilterId = (typeof filters)[number]["id"];

export function VerificationQueue() {
  const [oldestFirst, setOldestFirst] = useState(false);
  const [filter, setFilter] = useState<FilterId>("all");

  const rows = useMemo(() => {
    const matched = queue.filter((item) => {
      if (filter === "attention") return needsAttention(item.status);
      if (filter === "ready") return item.status === "Ready for review";
      if (filter === "expired") return false;
      return true;
    });
    return matched.sort((a, b) => (oldestFirst ? b.waitingDays - a.waitingDays : a.waitingDays - b.waitingDays));
  }, [filter, oldestFirst]);

  return (
    <div className="admin-content-card">
      <div className="admin-card-heading">
        <div>
          <h2>Applications</h2>
          <p aria-live="polite">{rows.length} of {queue.length} sample cases</p>
        </div>
        <button aria-pressed={oldestFirst} className="text-button" onClick={() => setOldestFirst((value) => !value)} type="button">
          {oldestFirst ? "Sorted oldest first" : "Sort oldest first"}
        </button>
      </div>

      <div className="market-pills" role="group" aria-label="Filter cases">
        {filters.map((option) => (
          <button
            aria-pressed={filter === option.id}
            className={filter === option.id ? "button primary" : "button secondary"}
            key={option.id}
            onClick={() => setFilter(option.id)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <RouteState
          kind="empty"
          message="No sample case matches this filter. That is an empty result, not a claim that the live queue is empty."
          onRetry={() => setFilter("all")}
          retryLabel="Show all cases"
          title="No cases match"
        />
      ) : (
        <div className="table-scroll">
          <table>
            <caption className="sr-only">Verification cases awaiting admin review</caption>
            <thead>
              <tr>
                <th scope="col">Organization</th>
                <th scope="col">Type</th>
                <th scope="col">Market</th>
                <th scope="col">Status</th>
                <th scope="col">Waiting</th>
                <th scope="col"><span className="sr-only">Action</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.name}>
                  <td><strong>{item.name}</strong></td>
                  <td>{item.role}</td>
                  <td>{item.market}</td>
                  <td>
                    <span className={needsAttention(item.status) ? "status-chip warning" : "status-chip pending"}>
                      {item.status}
                    </span>
                  </td>
                  <td>{item.waitingDays === 1 ? "1 day" : `${item.waitingDays} days`}</td>
                  <td>
                    <button disabled title="Detail review needs the Gate B case-detail contract" type="button">Open</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="boundary-note">
        Fictional sample queue. Paginated cases, protected evidence references, scan state, and the
        approve / request-changes / reject decisions with reason codes and audit events all need Miraj&rsquo;s
        verification-queue contract (Human Gate B). Nothing on this screen writes to a backend.
      </p>
    </div>
  );
}
