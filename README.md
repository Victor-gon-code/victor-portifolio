# Victor Portifólio

Landing/portfólio pessoal de **Victor Eduardo**, criada como uma experiência visual leve, responsiva e orientada a conversão.

## Conceito

A abertura usa uma constelação de cinco pontos em um **M discreto**. Cada estrela representa uma área do site:

- Sobre mim
- Projetos
- Como funciona
- Informações
- Contato

Quando o visitante rola a página, as estrelas se conectam, o M ganha definição por um instante e os pontos sobem até se reorganizarem no cabeçalho. Assim, a própria constelação da hero vira a navegação persistente.

## Implementação

- HTML sem framework
- CSS responsivo e sem dependências externas
- JavaScript nativo
- Canvas leve para o céu de estrelas
- Animação ligada ao scroll com requestAnimationFrame
- DPR limitado e starfield a ~30fps
- suporte a `prefers-reduced-motion`
- IntersectionObserver para animações e navegação ativa
- sem imagens pesadas na abertura

## Executar localmente

Abra `index.html` diretamente no navegador ou use um servidor estático:

```bash
python -m http.server 8000
```

Depois acesse `http://localhost:8000`.

## Estrutura

- `index.html` — conteúdo e SEO
- `styles.css` — identidade visual e responsividade
- `script.js` — constelação, scroll, navegação e starfield
- `favicon.svg` — favicon inspirado no M da constelação
