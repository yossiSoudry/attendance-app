// lib/timezones.ts

// Common timezones for Israel and surrounding regions
export const COMMON_TIMEZONES = [
  { value: "Asia/Jerusalem", label: "ישראל (ירושלים)", offset: "+02:00/+03:00" },
  { value: "Europe/London", label: "לונדון", offset: "+00:00/+01:00" },
  { value: "Europe/Paris", label: "פריז", offset: "+01:00/+02:00" },
  { value: "Europe/Berlin", label: "ברלין", offset: "+01:00/+02:00" },
  { value: "America/New_York", label: "ניו יורק", offset: "-05:00/-04:00" },
  { value: "America/Los_Angeles", label: "לוס אנג'לס", offset: "-08:00/-07:00" },
  { value: "Asia/Dubai", label: "דובאי", offset: "+04:00" },
  { value: "Asia/Tokyo", label: "טוקיו", offset: "+09:00" },
  { value: "Australia/Sydney", label: "סידני", offset: "+10:00/+11:00" },
  { value: "UTC", label: "UTC", offset: "+00:00" },
] as const;

export type TimezoneOption = (typeof COMMON_TIMEZONES)[number];
