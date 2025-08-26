// src/lib/markdown.ts 
import { marked } from 'marked';

// Configuration de marked
marked.setOptions({
  breaks: true, // Convertit les sauts de ligne en <br>
  gfm: true, // GitHub Flavored Markdown
});

// Renderer personnalisé pour les styles Tailwind
const renderer = new marked.Renderer();

// Personnalisation des titres (nouvelle signature)
renderer.heading = ({ tokens, depth }) => {
  const text = renderer.parser.parseInline(tokens);
  const sizes = {
    1: 'text-3xl font-bold text-gray-900 mt-12 mb-6',
    2: 'text-2xl font-bold text-gray-900 mt-12 mb-6', 
    3: 'text-xl font-bold text-gray-900 mt-8 mb-4',
    4: 'text-lg font-semibold text-gray-900 mt-6 mb-3',
    5: 'text-base font-semibold text-gray-900 mt-4 mb-2',
    6: 'text-sm font-semibold text-gray-900 mt-4 mb-2'
  };
  return `<h${depth} class="${sizes[depth as keyof typeof sizes]}">${text}</h${depth}>`;
};

// Personnalisation des paragraphes (nouvelle signature)
renderer.paragraph = ({ tokens }) => {
  const text = renderer.parser.parseInline(tokens);
  return `<p class="text-gray-700 leading-relaxed mb-6">${text}</p>`;
};

// Personnalisation des liens (nouvelle signature)
renderer.link = ({ href, title, tokens }) => {
  const text = renderer.parser.parseInline(tokens);
  const titleAttr = title ? ` title="${title}"` : '';
  return `<a href="${href}"${titleAttr} class="text-orange-600 hover:text-orange-700 underline underline-offset-2" target="_blank" rel="noopener noreferrer">${text}</a>`;
};

// Personnalisation du texte en gras (nouvelle signature)
renderer.strong = ({ tokens }) => {
  const text = renderer.parser.parseInline(tokens);
  return `<strong class="font-semibold text-gray-900">${text}</strong>`;
};

// Personnalisation de l'italique (nouvelle signature)
renderer.em = ({ tokens }) => {
  const text = renderer.parser.parseInline(tokens);
  return `<em class="italic text-gray-700">${text}</em>`;
};

// Personnalisation des listes (nouvelle signature)
renderer.list = ({ items, ordered, start }) => {
  const tag = ordered ? 'ol' : 'ul';
  const classes = ordered ? 
    'list-decimal list-inside my-6 space-y-2 text-gray-700' : 
    'list-disc list-inside my-6 space-y-2 text-gray-700';
  
  const startAttr = ordered && start !== 1 ? ` start="${start}"` : '';
  const body = items.map(item => renderer.listitem(item)).join('');
  
  return `<${tag} class="${classes}"${startAttr}>${body}</${tag}>`;
};

renderer.listitem = ({ tokens }) => {
  const text = renderer.parser.parseInline(tokens);
  return `<li class="mb-2">${text}</li>`;
};

// Personnalisation des blockquotes (nouvelle signature)
renderer.blockquote = ({ tokens }) => {
  const text = renderer.parser.parseInline(tokens);
  return `<blockquote class="border-l-4 border-orange-500 pl-6 my-8 italic text-gray-700 text-lg bg-orange-50 py-4 rounded-r-lg">${text}</blockquote>`;
};

// Personnalisation du code inline (nouvelle signature)
renderer.codespan = ({ text }) => {
  return `<code class="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-mono">${text}</code>`;
};

// Personnalisation des blocs de code (nouvelle signature)
renderer.code = ({ text, lang }) => {
  const langClass = lang ? ` class="language-${lang}"` : '';
  return `<pre class="bg-gray-900 text-gray-100 rounded-lg p-4 my-6 overflow-x-auto"><code${langClass}>${text}</code></pre>`;
};

// Configuration du renderer
marked.setOptions({ renderer });

export function parseMarkdownSimple(content: string): string {
  // Traiter les balises personnalisées d'abord
  let processedContent = content;

  processedContent = processedContent.replace(
    /\[IMAGE:([^\]]+)\]/g,
    '<div class="my-8"><img src="$1" alt="Image de l\'article" class="w-full rounded-lg shadow-lg" loading="lazy" /></div>'
  );

  processedContent = processedContent.replace(
    /\[QUOTE:([^\]]+)\]/g,
    '<blockquote class="border-l-4 border-orange-500 pl-6 my-8 italic text-gray-700 text-lg bg-orange-50 py-4 rounded-r-lg">$1</blockquote>'
  );

  processedContent = processedContent.replace(
    /\[INFO:([^\]]+)\]/g,
    '<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 my-6"><div class="flex"><div class="flex-shrink-0"><svg class="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg></div><div class="ml-3"><p class="text-blue-700">$1</p></div></div></div>'
  );

  // Utiliser marked avec configuration de base (sans renderer personnalisé)
  const htmlContent = marked(processedContent, {
    breaks: true,
    gfm: true
  });

  // Post-traitement pour ajouter les classes Tailwind
  let finalContent = htmlContent as string;

  // Ajouter les classes aux éléments HTML générés
  finalContent = finalContent.replace(
    /<h1>/g,
    '<h1 class="text-3xl font-bold text-gray-900 mt-12 mb-6">'
  );
  finalContent = finalContent.replace(
    /<h2>/g,
    '<h2 class="text-2xl font-bold text-gray-900 mt-12 mb-6">'
  );
  finalContent = finalContent.replace(
    /<h3>/g,
    '<h3 class="text-xl font-bold text-gray-900 mt-8 mb-4">'
  );
  finalContent = finalContent.replace(
    /<h4>/g,
    '<h4 class="text-lg font-semibold text-gray-900 mt-6 mb-3">'
  );
  finalContent = finalContent.replace(
    /<p>/g,
    '<p class="text-gray-700 leading-relaxed mb-6">'
  );
  finalContent = finalContent.replace(
    /<strong>/g,
    '<strong class="font-semibold text-gray-900">'
  );
  finalContent = finalContent.replace(
    /<em>/g,
    '<em class="italic text-gray-700">'
  );
  finalContent = finalContent.replace(
    /<ul>/g,
    '<ul class="list-disc list-inside my-6 space-y-2 text-gray-700">'
  );
  finalContent = finalContent.replace(
    /<ol>/g,
    '<ol class="list-decimal list-inside my-6 space-y-2 text-gray-700">'
  );
  finalContent = finalContent.replace(
    /<li>/g,
    '<li class="mb-2">'
  );
  finalContent = finalContent.replace(
    /<a /g,
    '<a class="text-orange-600 hover:text-orange-700 underline underline-offset-2" target="_blank" rel="noopener noreferrer" '
  );
  finalContent = finalContent.replace(
    /<code>/g,
    '<code class="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-mono">'
  );
  finalContent = finalContent.replace(
    /<pre><code/g,
    '<pre class="bg-gray-900 text-gray-100 rounded-lg p-4 my-6 overflow-x-auto"><code'
  );
  finalContent = finalContent.replace(
    /<blockquote>/g,
    '<blockquote class="border-l-4 border-orange-500 pl-6 my-8 italic text-gray-700 text-lg bg-orange-50 py-4 rounded-r-lg">'
  );

  return finalContent;
}