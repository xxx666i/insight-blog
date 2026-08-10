export function withBase(path = '/') {
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  const clean = path.replace(/^\//, '');
  return clean ? `${base}${clean}`.replace(/(?<!:)\/+/g, '/') : base;
}

export function canonical(path = '/') {
  return new URL(withBase(path), import.meta.env.SITE).toString();
}
