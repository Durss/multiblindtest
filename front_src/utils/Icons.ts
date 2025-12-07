// Automatic icon discovery with Vite
const iconModules = import.meta.glob<string>('@/assets/icons/*.svg', { 
  eager: true,
  as: 'url'
});

// Build icon map automatically from filenames
const icons: Record<string, string> = {};
for (const path in iconModules) {
  const fileName = path.match(/\/([^\/]+)\.svg$/)?.[1];
  if (fileName) {
    icons[fileName] = iconModules[path];
  }
}

// Type-safe icon name union
export type IconName = keyof typeof icons;

// Get icon with type safety and autocomplete
export function getIcon(name: IconName): string {
  return icons[name] || '';
}

// Export all icons for direct access if needed
export const allIcons = icons;
