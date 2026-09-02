const icons = {
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>',
  moon:'<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/>',
  user:'<path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/>',
  home:'<path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z"/>',
  compass:'<circle cx="12" cy="12" r="9"/><path d="m15 9-2 4-4 2 2-4Z"/>',
  library:'<path d="M4 5h5v15H4zM10 4h5v16h-5zM16 6h4v14h-4z"/>',
  arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
  close:'<path d="M6 6l12 12M18 6 6 18"/>',
  bookmark:'<path d="M6 4h12v17l-6-4-6 4z"/>',
  share:'<circle cx="18" cy="5" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="18" cy="19" r="2"/><path d="m8 11 8-5M8 13l8 5"/>',
  more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  rabbit:'<path d="M9 7c-1-3 0-5 1-5 2 0 2 4 2 5M13 7c1-3 2-5 3-4 1 1 0 4-1 6"/><path d="M7 12c0-4 2-6 5-6s5 2 5 6-2 8-5 8-5-4-5-8Z"/><path d="M9 14h.01M15 14h.01M11 17h2"/>',
  layers:'<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/>',
  chevron:'<path d="m9 18 6-6-6-6"/>',
  reply:'<path d="m9 17-5-5 5-5"/><path d="M4 12h9c4 0 7 2 7 6"/>',
  vote:'<path d="m12 4 6 7h-4v9h-4v-9H6z"/>',
  report:'<path d="M5 21V4M5 5h11l-2 4 2 4H5"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  source:'<path d="M7 3h8l4 4v14H7z"/><path d="M15 3v5h5M10 12h6M10 16h6"/>',
  trail:'<path d="M4 18c2-8 6-12 16-12"/><circle cx="4" cy="18" r="2"/><circle cx="20" cy="6" r="2"/><circle cx="12" cy="10" r="2"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M19 13.5V10.5l-2-.7-.6-1.5.9-1.9-2.1-2.1-1.9.9-1.5-.6L10.5 3h-3L6.8 5l-1.5.6-1.9-.9-2.1 2.1.9 1.9-.6 1.5L0 10.5v3l2 .7.6 1.5-.9 1.9 2.1 2.1 1.9-.9 1.5.6.7 2h3l.7-2 1.5-.6 1.9.9 2.1-2.1-.9-1.9.6-1.5z"/>',
  check:'<path d="m5 12 4 4 10-10"/>',
  fork:'<path d="M6 3v6a3 3 0 0 0 3 3h6M18 3v4a5 5 0 0 1-5 5M6 21v-9"/><circle cx="6" cy="3" r="2"/><circle cx="18" cy="3" r="2"/><circle cx="6" cy="21" r="2"/>',
  grid:'<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/>',
  logout:'<path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5"/><path d="m15 8 4 4-4 4M19 12H9"/>'
};

export function icon(name, size=20, label='') {
  const body = icons[name] || icons.layers;
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="${label?'false':'true'}" ${label?`aria-label="${label}"`:''}>${body}</svg>`;
}
