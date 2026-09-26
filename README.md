# Victor Portfólio

Portfólio pessoal de **Victor Eduardo**, desenvolvedor web full stack. O site foi construído para apresentar trabalho, serviços e processo de forma rápida, responsiva e orientada a contato.

## Conceito visual

A abertura usa uma constelação de cinco pontos formando um **M discreto**. Cada estrela leva a uma área do site:

- Sobre
- Projetos
- Serviços
- Processo
- Contato

Durante o primeiro scroll, as estrelas se conectam e se reorganizam no cabeçalho, fazendo a transição da identidade visual para a navegação persistente.

## Projeto em destaque

O portfólio apresenta o **Tá na Rede**, produto SaaS esportivo criado por Victor Eduardo, com telas reais da experiência do jogador e do perfil esportivo.

## Implementação

- HTML sem framework
- CSS responsivo e sem dependências externas
- JavaScript nativo
- `requestAnimationFrame` apenas durante a transição inicial da constelação
- `IntersectionObserver` para revelação de conteúdo, navegação ativa e carregamento de mídia
- suporte a `prefers-reduced-motion`
- telas do projeto carregadas sob demanda em WebP, mantendo 1080 × 1920
- metadados Open Graph, Twitter Card e JSON-LD
- foco visível, skip link e navegação por teclado

## Executar localmente

```bash
python -m http.server 8000
```

Depois acesse `http://localhost:8000`.

## Estrutura

- `index.html` — conteúdo, semântica e SEO
- `styles.css` — identidade visual e responsividade
- `script.js` — constelação, scroll, navegação, mídia e revelações
- `assets/hero-final.webp` — imagem principal
- `assets/media/` — mídia otimizada do case Tá na Rede
- `favicon.svg` — favicon baseado na constelação
- `robots.txt` e `sitemap.xml` — rastreamento e indexação
