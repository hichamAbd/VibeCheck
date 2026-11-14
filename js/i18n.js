// English and French. Each visitor sees the language of their phone.

const first = ((navigator.languages && navigator.languages[0]) || navigator.language || 'en').toLowerCase();
export const lang = first.startsWith('fr') ? 'fr' : 'en';
document.documentElement.lang = lang;

const S = {
  en: {
    mood1: 'Awful', mood2: 'Bad', mood3: 'Okay', mood4: 'Good', mood5: 'Great',
    earlier: 'Earlier today',
    empty_title: 'Moody McMugface is still asleep',
    empty_body: 'No vibe posted yet today. Check back a bit later.',
    need_link_title: 'This page needs its full link',
    need_link_body: 'Ask the person who shared VibeCheck with you to send the link again.',
    bad_link_title: 'This link doesn’t open this VibeCheck',
    bad_link_body: 'It may be cut short or out of date. Ask for a fresh link.',
    offline: 'You’re offline. This is the last vibe this phone saw.',
    updated: 'Updated {when}',
    refresh: 'Refresh',
    loading: 'Loading',
    just_me_badge: 'Just me',
    how_are_you: 'How are you?',
    comment_label: 'Add a few words',
    comment_ph: 'Coffee was perfect',
    just_me: 'Just me',
    just_me_hint: 'Friends won’t see this one.',
    post: 'Post',
    posting: 'Posting…',
    posted: 'Posted. Friends see it within a minute or two.',
    pick_face: 'Pick a face first.',
    tab_today: 'Today',
    tab_year: 'Year',
    year_prev: 'Previous year',
    year_next: 'Next year',
    year_count: '{n} moods this year',
    year_count_one: '1 mood this year',
    year_count_zero: 'No moods this year yet',
    day_empty: 'No moods this day.',
    unlock: 'Unlock',
    lock: 'Lock',
    menu: 'Menu',
    close: 'Close',
    enter_pin: 'Enter your PIN',
    pin_label: 'PIN',
    wrong_pin: 'Wrong PIN. Try again.',
    pin_wait: 'Too many tries. Wait {s} seconds.',
    unlocking: 'Unlocking…',
    share_link: 'Share friends’ link',
    link_copied: 'Link copied',
    share_text: 'How I’m feeling today',
    save_backup: 'Save backup file',
    backup_saved: 'Backup file ready',
    replace_key: 'Replace GitHub key',
    key_replaced: 'GitHub key replaced',
    forget_phone: 'Remove from this phone',
    forget_confirm: 'Remove posting from this phone? Your moods stay safe on GitHub. You’ll need your backup file to set this phone up again.',
    forgotten: 'Removed from this phone',
    edit_title: 'Edit mood',
    save: 'Save',
    saved: 'Saved',
    delete: 'Delete',
    delete_confirm: 'Delete this mood?',
    deleted: 'Deleted',
    cancel: 'Cancel',
    err_key: 'GitHub refused your key. It may have expired: replace it from the menu.',
    err_net: 'Couldn’t reach GitHub. Check your connection and try again.',
    err_other: 'GitHub said no ({code}). Try again in a moment.',
    key_expiring: 'Your GitHub key is almost a year old and will stop working soon.',
    // setup
    setup_title: 'Post from this phone',
    setup_intro: 'Only this phone will be able to post. It takes about two minutes.',
    setup_homescreen: 'Add VibeCheck to your Home Screen first and set it up from there: your iPhone keeps Home Screen apps separate from Safari.',
    setup_step1: 'Create your GitHub key',
    setup_step1_body: 'On GitHub, under Repository access, choose Only select repositories, then pick VibeCheck. Scroll down, tap Generate token, then copy it.',
    setup_open_github: 'Open GitHub',
    setup_paste: 'Paste your key',
    setup_step2: 'Choose a 6-digit PIN',
    setup_step2_body: 'You’ll type it to post and to open your backup file. Nobody can reset it, so pick one you’ll remember.',
    setup_pin: 'PIN',
    setup_pin2: 'Same PIN again',
    setup_go: 'Set up posting',
    setup_checking: 'Checking your key…',
    setup_creating: 'Creating your encrypted diary…',
    setup_err_key: 'That key didn’t work. Check you copied all of it and picked VibeCheck.',
    setup_err_write: 'That key can’t save to VibeCheck. On GitHub, pick Only select repositories, then VibeCheck, and give it Contents: Read and write.',
    setup_err_pin: 'Use exactly 6 digits.',
    setup_err_pin2: 'The two PINs don’t match.',
    setup_err_token: 'Paste your GitHub key first.',
    restore_title: 'Bring your history to this phone',
    restore_body: 'This VibeCheck already has a history. Open your backup file to unlock it here.',
    restore_pick: 'Choose backup file',
    restore_pin: 'Backup file PIN',
    restore_wrong: 'That file or PIN doesn’t open this history.',
    restore_badfile: 'That isn’t a VibeCheck backup file.',
    restore_fresh: 'Start over instead',
    restore_fresh_confirm: 'Start over? Your old history and your friends’ old link will stop working for good.',
    done_title: 'You’re all set',
    done_backup: 'Save your backup file now. It holds the keys to your history, locked with your PIN.',
    done_link: 'Then send this link to your friends. They’ll only see today’s moods.',
    done_finish: 'Done',
    // easter eggs
    poke: 'Moody McMugface doesn’t like being poked',
    poke_more: 'Fine. Moody’s awake now.',
    ladybug: 'You found the ladybug. Lucky day.',
    all_peeled: 'You peeled every sticker',
    aprilfool: 'April fool!',
    wordmark: 'VibeCheck',
    mascot: 'Moody McMugface',
  },
  fr: {
    mood1: 'Horrible', mood2: 'Pas top', mood3: 'Bof', mood4: 'Bien', mood5: 'Super',
    earlier: 'Plus tôt aujourd’hui',
    empty_title: 'Moody McMugface dort encore',
    empty_body: 'Pas encore de vibe aujourd’hui. Repasse un peu plus tard.',
    need_link_title: 'Cette page a besoin de son lien complet',
    need_link_body: 'Demande à la personne qui t’a partagé VibeCheck de te renvoyer le lien.',
    bad_link_title: 'Ce lien n’ouvre pas ce VibeCheck',
    bad_link_body: 'Il est peut-être incomplet ou trop ancien. Demande un nouveau lien.',
    offline: 'Tu es hors ligne. Voici la dernière vibe vue sur ce téléphone.',
    updated: 'Mis à jour {when}',
    refresh: 'Actualiser',
    loading: 'Chargement',
    just_me_badge: 'Juste moi',
    how_are_you: 'Comment ça va ?',
    comment_label: 'Ajoute quelques mots',
    comment_ph: 'Le café était parfait',
    just_me: 'Juste pour moi',
    just_me_hint: 'Tes amis ne verront pas celle-ci.',
    post: 'Publier',
    posting: 'Publication…',
    posted: 'Publié. Tes amis la verront d’ici une minute ou deux.',
    pick_face: 'Choisis d’abord une tête.',
    tab_today: 'Aujourd’hui',
    tab_year: 'Année',
    year_prev: 'Année précédente',
    year_next: 'Année suivante',
    year_count: '{n} humeurs cette année',
    year_count_one: '1 humeur cette année',
    year_count_zero: 'Aucune humeur cette année pour l’instant',
    day_empty: 'Aucune humeur ce jour-là.',
    unlock: 'Déverrouiller',
    lock: 'Verrouiller',
    menu: 'Menu',
    close: 'Fermer',
    enter_pin: 'Entre ton code',
    pin_label: 'Code',
    wrong_pin: 'Code incorrect. Réessaie.',
    pin_wait: 'Trop d’essais. Attends {s} secondes.',
    unlocking: 'Déverrouillage…',
    share_link: 'Partager le lien des amis',
    link_copied: 'Lien copié',
    share_text: 'Mon humeur du jour',
    save_backup: 'Enregistrer une sauvegarde',
    backup_saved: 'Sauvegarde prête',
    replace_key: 'Remplacer la clé GitHub',
    key_replaced: 'Clé GitHub remplacée',
    forget_phone: 'Retirer de ce téléphone',
    forget_confirm: 'Retirer la publication de ce téléphone ? Tes humeurs restent en sécurité sur GitHub. Il te faudra ta sauvegarde pour reconfigurer ce téléphone.',
    forgotten: 'Retiré de ce téléphone',
    edit_title: 'Modifier l’humeur',
    save: 'Enregistrer',
    saved: 'Enregistré',
    delete: 'Supprimer',
    delete_confirm: 'Supprimer cette humeur ?',
    deleted: 'Supprimée',
    cancel: 'Annuler',
    err_key: 'GitHub a refusé ta clé. Elle a peut-être expiré : remplace-la depuis le menu.',
    err_net: 'Impossible de joindre GitHub. Vérifie ta connexion et réessaie.',
    err_other: 'GitHub a refusé ({code}). Réessaie dans un instant.',
    key_expiring: 'Ta clé GitHub a presque un an et va bientôt cesser de fonctionner.',
    setup_title: 'Publier depuis ce téléphone',
    setup_intro: 'Seul ce téléphone pourra publier. Ça prend environ deux minutes.',
    setup_homescreen: 'Ajoute d’abord VibeCheck à ton écran d’accueil et configure-le depuis là : l’iPhone sépare les apps de l’écran d’accueil de Safari.',
    setup_step1: 'Crée ta clé GitHub',
    setup_step1_body: 'Sur GitHub, sous Repository access, choisis Only select repositories, puis VibeCheck. Descends, touche Generate token, puis copie-la.',
    setup_open_github: 'Ouvrir GitHub',
    setup_paste: 'Colle ta clé',
    setup_step2: 'Choisis un code à 6 chiffres',
    setup_step2_body: 'Tu le taperas pour publier et pour ouvrir ta sauvegarde. Personne ne peut le réinitialiser : choisis-en un dont tu te souviendras.',
    setup_pin: 'Code',
    setup_pin2: 'Le même code',
    setup_go: 'Activer la publication',
    setup_checking: 'Vérification de ta clé…',
    setup_creating: 'Création de ton journal chiffré…',
    setup_err_key: 'Cette clé ne marche pas. Vérifie que tu l’as copiée en entier et que tu as choisi VibeCheck.',
    setup_err_write: 'Cette clé ne peut pas enregistrer dans VibeCheck. Sur GitHub, choisis Only select repositories, puis VibeCheck, et donne-lui Contents : Read and write.',
    setup_err_pin: 'Utilise exactement 6 chiffres.',
    setup_err_pin2: 'Les deux codes ne correspondent pas.',
    setup_err_token: 'Colle d’abord ta clé GitHub.',
    restore_title: 'Récupère ton historique sur ce téléphone',
    restore_body: 'Ce VibeCheck a déjà un historique. Ouvre ta sauvegarde pour le déverrouiller ici.',
    restore_pick: 'Choisir la sauvegarde',
    restore_pin: 'Code de la sauvegarde',
    restore_wrong: 'Ce fichier ou ce code n’ouvre pas cet historique.',
    restore_badfile: 'Ce n’est pas une sauvegarde VibeCheck.',
    restore_fresh: 'Recommencer à zéro',
    restore_fresh_confirm: 'Recommencer à zéro ? Ton ancien historique et l’ancien lien de tes amis ne marcheront plus jamais.',
    done_title: 'Tout est prêt',
    done_backup: 'Enregistre ta sauvegarde maintenant. Elle contient les clés de ton historique, verrouillées par ton code.',
    done_link: 'Puis envoie ce lien à tes amis. Ils ne verront que les humeurs du jour.',
    done_finish: 'Terminé',
    poke: 'Moody McMugface n’aime pas qu’on le titille',
    poke_more: 'Bon. Moody est réveillé.',
    ladybug: 'Tu as trouvé la coccinelle. Jour de chance.',
    all_peeled: 'Tu as décollé tous les autocollants',
    aprilfool: 'Poisson d’avril !',
    wordmark: 'VibeCheck',
    mascot: 'Moody McMugface',
  },
};

export function t(key, vars) {
  let s = (S[lang] && S[lang][key]) ?? S.en[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

export const moodName = (m) => t(`mood${m}`);

export function fmtTime(iso) {
  return new Intl.DateTimeFormat(lang, { hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
}

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function fmtDay(date) {
  return cap(new Intl.DateTimeFormat(lang, { weekday: 'long', day: 'numeric', month: 'long' }).format(date));
}

export function fmtDayKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return cap(new Intl.DateTimeFormat(lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(y, m - 1, d, 12)));
}

export function monthInitials() {
  const f = new Intl.DateTimeFormat(lang, { month: 'narrow' });
  return Array.from({ length: 12 }, (_, i) => f.format(new Date(2026, i, 15)));
}

export function monthLong(i) {
  return cap(new Intl.DateTimeFormat(lang, { month: 'long' }).format(new Date(2026, i, 15)));
}

export function fmtRel(iso) {
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
  const sec = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const abs = Math.abs(sec);
  if (abs < 45) return rtf.format(0, 'second');
  if (abs < 3600) return rtf.format(Math.round(sec / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(sec / 3600), 'hour');
  return rtf.format(Math.round(sec / 86400), 'day');
}
