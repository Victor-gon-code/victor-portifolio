# Victor Eduardo — Portfólio

Portfólio pessoal de **Victor Eduardo**, desenvolvedor web focado em sites, sistemas, automações e produtos digitais.

## Direção visual

A versão atual abandonou completamente o visual escuro anterior.

O site agora segue uma linguagem clara, colorida e mais pessoal, inspirada em portfólios editoriais, zines e páginas experimentais que usam tipografia, espaço vazio, humor e pequenos detalhes interativos como identidade — sem depender de cards repetitivos, glassmorphism, gradientes neon ou estruturas numeradas.

A ideia principal é parecer um site de uma pessoa, não um template de produto.

## Estrutura do site

- apresentação pessoal direta e informal;
- seção "Sobre" com retrato real e texto em voz natural;
- case do Tá na Rede com telas reais do produto;
- serviços explicados através de frases que um cliente realmente poderia mandar;
- processo sem etapas numeradas;
- contato com linguagem simples e direta;
- pequeno easter egg para trocar a cor dos detalhes da interface.

## Projeto em destaque

### Tá na Rede

SaaS esportivo criado do zero para conectar jogadores, partidas, times, grupos e arenas.

O case usa telas reais e explica o produto de forma simples, incluindo a stack e os aprendizados de desenvolvimento, deploy e uso mobile.

## Stack do portfólio

- HTML sem framework
- CSS responsivo
- JavaScript nativo
- Google Fonts:
  - Bricolage Grotesque
  - Newsreader
  - IBM Plex Mono
- IntersectionObserver para revelações leves e navegação
- suporte a `prefers-reduced-motion`
- SEO básico, Open Graph, Twitter Card e JSON-LD

## Arquivos principais

- `index.html` — estrutura e conteúdo
- `styles.css` — sistema visual completo
- `script.js` — navegação, revelações e pequenos detalhes interativos
- `assets/victor-editorial.png` — retrato original
- `assets/tanarede-home.webp`
- `assets/tanarede-perfil.webp`
- `favicon.svg`
- `robots.txt`
- `sitemap.xml`

## Rodar localmente

```bash
python -m http.server 8000
```

Abra:

```
http://localhost:8000
```

## Produção

**https://victoreduardodev.tech**
