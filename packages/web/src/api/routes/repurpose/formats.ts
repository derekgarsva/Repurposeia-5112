export type FormatDef = {
  key: string;
  label: string;
  hint: string;
  brief: string;
};

/** Los formatos de salida que produce la automatización. */
export const FORMATS: FormatDef[] = [
  {
    key: "x_thread",
    label: "Hilo de X",
    hint: "5-7 tuits",
    brief:
      "Un hilo de X/Twitter de 5 a 7 tuits. Numera cada tuit como '1/', '2/', etc. El primer tuit es un gancho fuerte sin hashtags. Máximo 270 caracteres por tuit. Separa cada tuit con una línea vacía. Sin emojis decorativos, máximo uno donde aporte.",
  },
  {
    key: "linkedin",
    label: "Post de LinkedIn",
    hint: "1200-1600 caracteres",
    brief:
      "Un post de LinkedIn de 1200 a 1600 caracteres. Primera línea = gancho de una sola frase. Párrafos de 1-2 líneas separados por líneas vacías. Incluye una lista con guiones en el medio y cierra con una pregunta abierta. Sin hashtags al inicio; máximo 3 hashtags al final.",
  },
  {
    key: "newsletter",
    label: "Newsletter",
    hint: "asunto + cuerpo",
    brief:
      "Un email de newsletter. Empieza con 'Asunto: ' y una línea de asunto de menos de 60 caracteres, luego una línea vacía, luego un cuerpo de 200-300 palabras con subtítulos en negrita markdown y un cierre con una acción concreta para el lector.",
  },
  {
    key: "short_script",
    label: "Guion de video corto",
    hint: "30-45 s",
    brief:
      "Un guion para Reel/TikTok/Short de 30 a 45 segundos. Estructura con marcas de tiempo tipo '[0-3s] GANCHO:' seguidas del texto a decir. Incluye una indicación visual breve entre paréntesis en cada bloque. Termina con un CTA hablado.",
  },
  {
    key: "seo_meta",
    label: "SEO & titulares",
    hint: "títulos + meta",
    brief:
      "Un bloque SEO con exactamente estas secciones en markdown: '**5 titulares alternativos**' (lista numerada, cada uno bajo 60 caracteres), '**Meta descripción**' (una sola frase de 150-158 caracteres), '**Palabras clave**' (8 términos separados por comas).",
  },
  {
    key: "key_takeaways",
    label: "Ideas clave",
    hint: "resumen accionable",
    brief:
      "Entre 4 y 6 ideas clave del contenido, cada una como un guion con una frase en negrita markdown seguida de una explicación de una línea. Que sean accionables, no genéricas.",
  },
];

export const FORMAT_KEYS = FORMATS.map((f) => f.key);

export const TONES = [
  { key: "profesional", label: "Profesional" },
  { key: "directo", label: "Directo y sin rodeos" },
  { key: "cercano", label: "Cercano y conversacional" },
  { key: "provocador", label: "Provocador / opinión fuerte" },
  { key: "didactico", label: "Didáctico" },
] as const;

export const LANGUAGES = [
  { key: "es", label: "Español" },
  { key: "en", label: "English" },
  { key: "pt", label: "Português" },
  { key: "fr", label: "Français" },
  { key: "nl", label: "Nederlands" },
] as const;

export const LANGUAGE_NAMES: Record<string, string> = {
  es: "español",
  en: "inglés",
  pt: "portugués de Brasil",
  fr: "francés",
  nl: "neerlandés",
};
