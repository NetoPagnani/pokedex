# [Pokédex](https://netopagnani.github.io/pokedex/)

Uma Pokédex web interativa e avançada, com animação de abertura/fechamento, temas por geração, busca avançada, comparação de Pokémon, favoritos e narração por voz. Construída com HTML, CSS e JavaScript puros, consumindo dados da [PokéAPI](https://pokeapi.co).

## ✨ Funcionalidades

- **Pokédex animada**: abre e fecha com efeito visual, simulando o dispositivo clássico.
- **Temas por geração**: alterne entre os visuais de Kanto, Johto, Hoenn, Sinnoh, Unova, Kalos, Alola e Paldea (gerações 1 a 9).
- **Busca avançada**: pesquise por nome, tipo, habilidade ou região.
- **Lista completa**: navegue por todos os Pokémon com filtro de busca.
- **Favoritos**: marque e acesse rapidamente seus Pokémon favoritos.
- **Comparação**: compare atributos de dois Pokémon lado a lado.
- **Pokémon aleatório**: descubra um Pokémon com um clique.
- **Narração por voz**: ouça o nome/informações do Pokémon (liga/desliga o áudio).
- **Interface responsiva e acessível**: uso de atributos ARIA, `aria-live`, navegação por teclado e leitura de tela.

## 🖥️ Demonstração

> Adicione aqui um GIF ou screenshot da Pokédex em ação.

## 🚀 Tecnologias

- **HTML5**
- **CSS3** (temas dinâmicos, animações)
- **JavaScript** (Vanilla JS)
- **[PokéAPI](https://pokeapi.co)** — fonte dos dados dos Pokémon
- Fontes: [Orbitron](https://fonts.google.com/specimen/Orbitron) e [Rajdhani](https://fonts.google.com/specimen/Rajdhani) via Google Fonts

## 📦 Como executar localmente

Como o projeto é feito em HTML/CSS/JS puro, não é necessário instalar dependências.

```bash
# Clone o repositório
git clone https://github.com/NetoPagnani/pokedex.git

# Entre na pasta do projeto
cd pokedex

# Abra o index.html no navegador
```

Ou, para evitar problemas de CORS ao consumir a API, sirva os arquivos com um servidor local, por exemplo:

```bash
# Usando Python
python3 -m http.server 8000
```

Depois acesse `http://localhost:8000` no navegador.

## 📁 Estrutura do projeto

```
pokedex/
├── index.html    # Estrutura da página
├── styles.css    # Estilos e temas
├── script.js     # Lógica da aplicação e integração com a PokéAPI
└── LICENSE       # Licença MIT
```

## 🎮 Como usar

1. Clique na Pokédex fechada para abri-la.
2. Use as setas **Anterior**/**Próximo** para navegar entre os Pokémon.
3. Digite na barra de busca e escolha o critério (nome, tipo, habilidade ou região).
4. Clique na estrela para adicionar aos **favoritos**.
5. Use **⚖️ Comparar** para ver dois Pokémon lado a lado.
6. Explore os **temas** por geração para mudar a aparência da Pokédex.
7. Clique em **🎲 Aleatório** para descobrir um Pokémon surpresa.

## 📄 Licença

Este projeto está sob a licença [MIT](LICENSE).

## 🙌 Créditos

- Dados fornecidos pela [PokéAPI](https://pokeapi.co).
- Desenvolvido por [Orlando Pagnani (NetoPagnani)](https://github.com/NetoPagnani).
