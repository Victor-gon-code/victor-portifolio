# Victor Eduardo — Portfólio

Portfólio profissional de **Victor Eduardo**, desenvolvedor web focado em sites, sistemas, automações e produtos digitais.

## Direção do projeto

A primeira tela mantém a constelação como assinatura visual do portfólio. A partir dela, o site segue uma direção editorial mais sóbria e autoral, com tipografia forte, conteúdo real e poucas interações bem escolhidas.

O objetivo da interface é evitar aparência de template: sem grades de cards repetitivos, sem numeração artificial de etapas e sem efeitos usados apenas como decoração.

## Projeto em destaque

### Tá na Rede

Produto SaaS esportivo criado do zero para conectar jogadores, partidas, times, grupos e arenas.

O portfólio trata o Tá na Rede como um case real de produto: telas verdadeiras, recursos implementados, stack e contexto de desenvolvimento, em vez de mockups genéricos.

## Stack do portfólio

- HTML sem framework
- CSS responsivo
- JavaScript nativo
- Google Fonts: Instrument Serif + DM Sans
- IntersectionObserver
- requestAnimationFrame para a navegação em constelação
- suporte a `prefers-reduced-motion`
- SEO básico, Open Graph, Twitter Card e JSON-LD
- layout próprio para desktop, tablet e mobile

## Estrutura

- `index.html` — conteúdo, semântica e SEO
- `styles.css` — base original, hero e constelação
- `site-v3.css` — sistema visual editorial do restante do portfólio
- `script.js` — constelação, navegação e revelação progressiva
- `assets/hero-final.webp` — arte principal
- `assets/victor-editorial.png` — retrato original em alta resolução
- `assets/tanarede-home.webp` e `assets/tanarede-perfil.webp` — telas reais do Tá na Rede
- `favicon.svg` — favicon
- `robots.txt` e `sitemap.xml` — indexação

## Executar localmente

```bash
python -m http.server 8000
```

Depois abra `http://localhost:8000`.

## Produção

Domínio principal: **victoreduardodev.tech**
