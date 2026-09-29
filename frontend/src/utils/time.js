const pad = (n) => String(n).padStart(2, '0');

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

export function formatTime(iso) {
  const date = new Date(iso);
  let hours = date.getHours();
  const suffix = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${pad(date.getMinutes())} ${suffix}`;
}

export function isSameDay(a, b) {
  return startOfDay(new Date(a)) === startOfDay(new Date(b));
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDayLabel(iso) {
  const date = new Date(iso);
  const diffDays = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatLastSeen(iso) {
  if (!iso) return 'offline';
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'last seen just now';
  if (seconds < 3600) return `last seen ${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `last seen ${Math.floor(seconds / 3600)}h ago`;
  return `last seen ${formatDayLabel(iso)}`;
}
