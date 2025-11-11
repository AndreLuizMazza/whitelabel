// src/lib/seo.js

/**
 * Atualiza <title> e metas de descrição/OG/Twitter.
 * Uso:
 *   setPageSEO({ title: 'Meu perfil', description: 'Edite seus dados...' })
 */
export function setPageSEO({ title, description, image, url } = {}) {
  if (typeof document === 'undefined') return;

  // Título
  if (title) document.title = title;

  // Helpers
  const upsert = (selector, attrs = {}) => {
    let el = document.head.querySelector(selector);
    if (!el) {
      el = document.createElement('meta');
      // define name/property a partir do selector
      if (selector.startsWith('meta[name=')) {
        el.setAttribute('name', selector.match(/meta\[name="([^"]+)"\]/)[1]);
      } else if (selector.startsWith('meta[property=')) {
        el.setAttribute('property', selector.match(/meta\[property="([^"]+)"\]/)[1]);
      }
      document.head.appendChild(el);
    }
    Object.entries(attrs).forEach(([k, v]) => {
      if (v != null && v !== '') el.setAttribute(k, v);
    });
  };

  // Descrição padrão herdada se não vier descrição específica
  const desc = description || 'Plataforma Progem — área do associado, contratos e benefícios.';

  // Meta description
  upsert('meta[name="description"]', { content: desc });

  // Open Graph
  upsert('meta[property="og:title"]', { content: title || document.title });
  upsert('meta[property="og:description"]', { content: desc });
  if (url) upsert('meta[property="og:url"]', { content: url });
  if (image) upsert('meta[property="og:image"]', { content: image });
  upsert('meta[property="og:type"]', { content: 'website' });

  // Twitter Cards
  upsert('meta[name="twitter:card"]', { content: image ? 'summary_large_image' : 'summary' });
  upsert('meta[name="twitter:title"]', { content: title || document.title });
  upsert('meta[name="twitter:description"]', { content: desc });
  if (image) upsert('meta[name="twitter:image"]', { content: image });
}
