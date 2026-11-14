// Picks the look of the page from today's date (northern hemisphere).
// Personal dates (birthdays, Valentine's Day) are deliberately left out.

export const THEMES = ['autumn', 'winter', 'spring', 'summer', 'halloween', 'christmas', 'newyear', 'aprilfools'];

export function themeFor(date = new Date()) {
  const md = (date.getMonth() + 1) * 100 + date.getDate();
  let season;
  if (md >= 1221 || md < 320) season = 'winter';
  else if (md < 621) season = 'spring';
  else if (md < 922) season = 'summer';
  else season = 'autumn';

  let special = null;
  if (md === 1231 || md === 101) special = 'newyear';
  else if (md === 401) special = 'aprilfools';
  else if (md >= 1024 && md <= 1031) special = 'halloween';
  else if (md >= 1218 && md <= 1226) special = 'christmas';

  // Anyone can preview a look by adding ?look=winter (etc.) to the address.
  try {
    const forced = new URLSearchParams(location.search).get('look');
    if (forced && THEMES.includes(forced)) {
      return { key: forced, season: ['autumn', 'winter', 'spring', 'summer'].includes(forced) ? forced : season, special: ['autumn', 'winter', 'spring', 'summer'].includes(forced) ? null : forced };
    }
  } catch (e) { /* ignore */ }

  return { key: special || season, season, special };
}
