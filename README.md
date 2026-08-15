# SINIT Consulting - Landing Page

Esta es la landing page oficial de SINIT Consulting, construida con Astro, React, Tailwind CSS y Netlify Functions.

## Requisitos

- Node.js 18+
- npm o pnpm

## Instalación

1. Clona el repositorio e instala las dependencias:
   ```bash
   npm install
   ```

2. Copia el archivo `.env.example` a `.env` y configura el webhook de n8n:
   ```bash
   cp .env.example .env
   # Edita .env con tu N8N_WEBHOOK_URL
   ```

## Desarrollo Local

Para probar las Netlify Functions localmente junto con Astro, usa Netlify CLI:

```bash
npm run dev
# o si usas netlify-cli
npx netlify dev
```

El servidor estará disponible en `http://localhost:8888`.

## Despliegue en Netlify

El sitio está configurado para despliegue automático mediante Netlify y GitHub.

1. **Variables de Entorno**: En Netlify, ve a **Site Settings > Environment Variables** y agrega la variable `N8N_WEBHOOK_URL` con la URL de tu webhook.
2. **Importante:** Nunca uses el prefijo `PUBLIC_` en esta variable para evitar que se filtre en el cliente.

## Contrato de Payload (Frontend a Backend)

El cliente (navegador) envía una petición `POST` a `/api/lead` con el siguiente formato JSON:

```json
{
  "canal": "whatsapp", // o "correo"
  "seccion_origen": "hero",
  "servicio_interes": "general",
  "pagina": "/",
  "timestamp": "2026-08-14T10:32:00Z",
  "honeypot": "" // Campo oculto, si tiene valor se ignora
}
```

El backend (`netlify/functions/lead.ts`) procesa esta petición, la valida con `zod` y la reenvía al webhook configurado en `N8N_WEBHOOK_URL` exactamente con los mismos campos (sin el honeypot).
