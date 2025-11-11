// src/utils/rtdbPaths.js

// Users and email index
export const pathUsers = () => `/users`;
export const pathUser = (uid) => `/users/${uid}`;
export const pathEmailIndex = () => `/emailToUid`;
export const pathEmailUid = (key) => `/emailToUid/${key}`;

// Private profile and preferences
export const pathProfiles = () => `/profiles`;
export const pathProfile = (uid) => `/profiles/${uid}`;        // private profile
export const pathPrefs = (uid) => `/prefs/${uid}`;              // private prefs

// Public-safe profile+prefs (used for names, matching, suggestions)
export const pathPublicRoot = () => `/public`;
export const pathPublic = (uid) => `/public/${uid}`;

// Groups and membership
export const pathGroups = () => `/groups`;
export const pathGroup = (gid) => `/groups/${gid}`;
export const pathMembers = (gid) => `/groups/${gid}/members`;

// Expenses and balances
export const pathExpenses = (gid) => `/expenses/${gid}`;
export const pathExpense = (gid, eid) => `/expenses/${gid}/${eid}`;
export const pathBalances = (gid) => `/balances/${gid}`;
export const pathBalance = (gid, uid) => `/balances/${gid}/${uid}`;

// Community
export const pathPosts = () => `/communityPosts`;