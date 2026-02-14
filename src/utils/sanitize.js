const stripTags = value => value.replace(/<[^>]*>?/gm, '');

export const sanitizeString = value => {
  if (typeof value !== 'string') return '';
  return stripTags(value).trim();
};

export const sanitizeTags = tags => {
  let list = [];
  if (Array.isArray(tags)) {
    list = tags;
  } else if (typeof tags === 'string') {
    list = tags.split(','); // admite CSV del front
  } else {
    return [];
  }

  const map = new Map();
  for (const raw of list) {
    const clean = sanitizeString(raw);
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (!map.has(key)) map.set(key, clean);
    if (map.size >= 5) break;
  }
  return Array.from(map.values());
};

export const sanitizeAlumnos = value => {
  if (Array.isArray(value)) {
    return value
      .map(v => sanitizeString(v))
      .filter(Boolean)
      .join(', ');
  }
  return sanitizeString(value);
};
