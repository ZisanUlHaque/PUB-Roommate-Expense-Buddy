export function initials(name = "") {
  const parts = name.trim().split(/\s+/);
  if (!parts.length) return "U";
  const a = parts[0]?.[0] || "";
  const b = parts[1]?.[0] || "";
  return (a + b).toUpperCase();
}

export function colorFromString(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
  return `hsl(${h}, 70%, 50%)`;
}