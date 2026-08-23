# Repurpose AI — progreso

Automatización IA: texto/URL -> 6 formatos de contenido (hilo X, LinkedIn, newsletter, guion short, SEO, ideas clave).

## Hecho
- [x] app_init (/home/user/repurpose-ai), web only, puerto 4200
- [x] design.md (dark editorial, Instrument Serif + DM Sans, acento lima)
- [x] schema.ts -> tabla `runs`
- [x] api/agent/gateway.ts (claude-sonnet-4.6)
- [x] api/routes/repurpose/{index,formats,source}.ts — generate/history/get/remove/options, fetch+strip HTML de URL, Promise.all por formato
- [x] router compuesto en api/index.ts
- [x] queries/repurpose.ts
- [x] styles.css tokens + index.html fonts
- [x] components/format-card.tsx, components/composer.tsx

## Siguiente
- [ ] components/history.tsx
- [ ] pages/index.tsx (hero + split layout)
- [ ] db:push
- [ ] bun run build (tsc) + arrancar dev en 4200
- [ ] probar generate real vía curl/rpc
- [ ] deliver (type website, port 4200)
