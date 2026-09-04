"use client";

import { useSyncExternalStore } from "react";

/* Follows, reposts and saves share one key: they are read together on every
   render, and one parse is cheaper than three. */
export const SOCIAL_STORAGE_KEY = "bridge-social-v1";
const SOCIAL_EVENT = "bridge-social";

export type SocialState = {
  favorites: readonly string[];
  following: readonly string[];
  reposts: readonly string[];
};

/**
 * The owner's own numbers. Tori's rule: a follower count is back-end data, so
 * this belongs behind the member's own dashboard and must never be rendered
 * beside anyone else's profile.
 */
export type OwnAnalytics = {
  followers: number;
  following: number;
  repostsMade: number;
  repostsOfMyPosts: number;
  saved: number;
};

/* Sample data. A review build has no server, so the two figures that could
   only come from other members are fixed rather than invented per session. */
const SAMPLE_OWN_FOLLOWERS = 214;
const SAMPLE_OWN_REPOSTS = 37;

const EMPTY: SocialState = { favorites: [], following: [], reposts: [] };

/* useSyncExternalStore compares snapshots by identity, so the parsed state is
   held here and only replaced on a write. */
let snapshot: SocialState | null = null;

function ids(value: unknown): readonly string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function read(): SocialState {
  if (snapshot) return snapshot;
  if (typeof window === "undefined") return EMPTY;
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(SOCIAL_STORAGE_KEY) ?? "{}");
    const stored = (parsed ?? {}) as Partial<Record<keyof SocialState, unknown>>;
    snapshot = { favorites: ids(stored.favorites), following: ids(stored.following), reposts: ids(stored.reposts) };
  } catch {
    /* Private mode throws on read. An empty store is still a working store. */
    snapshot = EMPTY;
  }
  return snapshot;
}

function setMember(key: keyof SocialState, id: string, on: boolean) {
  const state = read();
  if (state[key].includes(id) === on) return;
  snapshot = { ...state, [key]: on ? [...state[key], id] : state[key].filter((item) => item !== id) };
  try {
    window.localStorage.setItem(SOCIAL_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    /* Private mode throws on write too. The session keeps working in memory. */
  }
  window.dispatchEvent(new Event(SOCIAL_EVENT));
}

/* Every reader takes the snapshot a component is subscribed to. Reading the
   live store instead would return the stored ids during the hydration pass,
   while useSyncExternalStore is still handing out the empty server snapshot -
   the two disagree and React throws the whole subtree away and re-renders. */
export function isFollowing(orgId: string, state: SocialState = read()) {
  return state.following.includes(orgId);
}

export function followOrg(orgId: string) {
  setMember("following", orgId, true);
}

export function unfollowOrg(orgId: string) {
  setMember("following", orgId, false);
}

export function isReposted(postId: string, state: SocialState = read()) {
  return state.reposts.includes(postId);
}

export function repost(postId: string) {
  setMember("reposts", postId, true);
}

export function unrepost(postId: string) {
  setMember("reposts", postId, false);
}

export function isFavorite(postId: string, state: SocialState = read()) {
  return state.favorites.includes(postId);
}

export function favoritePost(postId: string) {
  setMember("favorites", postId, true);
}

export function unfavoritePost(postId: string) {
  setMember("favorites", postId, false);
}

/* Sample engagement, derived from the id so the number is identical on the
   server, on the client and on every later render. */
function sampleReposts(postId: string) {
  let total = 0;
  for (let index = 0; index < postId.length; index += 1) total = (total * 31 + postId.charCodeAt(index)) % 1000;
  return total % 24;
}

export function repostCount(postId: string, state: SocialState = read()) {
  return sampleReposts(postId) + (isReposted(postId, state) ? 1 : 0);
}

export function getOwnAnalytics(state: SocialState = read()): OwnAnalytics {
  return {
    followers: SAMPLE_OWN_FOLLOWERS,
    following: state.following.length,
    repostsMade: state.reposts.length,
    repostsOfMyPosts: SAMPLE_OWN_REPOSTS,
    saved: state.favorites.length,
  };
}

function subscribe(onStoreChange: () => void) {
  /* Another tab wrote: drop the cache so the next snapshot re-reads storage. */
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== SOCIAL_STORAGE_KEY) return;
    snapshot = null;
    onStoreChange();
  };
  window.addEventListener(SOCIAL_EVENT, onStoreChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(SOCIAL_EVENT, onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
}

function getServerSnapshot(): SocialState {
  return EMPTY;
}

/**
 * Subscribes a component to every social change, so two controls for the same
 * org or post can never disagree. Read the values with the functions above.
 */
export function useSocial(): SocialState {
  return useSyncExternalStore(subscribe, read, getServerSnapshot);
}
