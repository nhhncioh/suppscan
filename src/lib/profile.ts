"use client";
import { useEffect, useState } from "react";
import type { Profile } from "@/types/suppscan";

const KEY = "suppscan_profile_v1";
const DEFAULT: Profile = { ageBand: "19-70", sex: "unspecified", pregnant: false };

export function loadProfile(): Profile {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
  } catch { return DEFAULT; }
}
export function saveProfile(p: Profile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(p));
}

export function useProfile(): [Profile, (p: Profile)=>void] {
  const [profile, setProfile] = useState<Profile>(DEFAULT);
  useEffect(()=>{ setProfile(loadProfile()); }, []);
  const set = (p: Profile) => { setProfile(p); saveProfile(p); };
  return [profile, set];
}
