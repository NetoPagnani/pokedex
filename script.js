// ========== UTILITÁRIOS ==========

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos
    .replace(/\s+/g, "-");
}

function debounce(fn, delay = 250) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

class Pokedex {
  constructor() {
    this.currentPokemon = 1;
    this.totalPokemons = 1025; // Nacional até Paldea (Gen 9)
    this.pokemonData = null;
    this.allPokemonList = [];
    this.pokemonDataCache = new Map();
    this.favorites = JSON.parse(
      localStorage.getItem("pokemonFavorites") || "[]",
    );
    this.isListLoaded = false;
    this.audioContext = null;
    this.imageCache = new Map();
    this.isSpeaking = false;
    this.speechEnabled = true;
    this.currentTheme = "gen1";
    this.darkMode = false;

    this.initializeElements();
    this.initializeAudio();
    this.initializeFemaleVoice();
    this.addEventListeners();
  }

  initializeElements() {
    this.closedPokedex = document.getElementById("closedPokedex");
    this.closedPokedexInner = this.closedPokedex?.querySelector(
      ".closed-pokedex-inner",
    );
    this.closePokedexBtn = document.getElementById("closePokedexBtn");
    this.pokedexContainer = document.getElementById("pokedexContainer");
    this.pokedexTheme = document.getElementById("pokedexTheme");

    this.pokemonImage = document.getElementById("pokemonImage");
    this.pokemonName = document.getElementById("pokemonName");
    this.pokemonNumber = document.getElementById("pokemonNumber");
    this.pokemonTypes = document.getElementById("pokemonTypes");
    this.pokemonHeight = document.getElementById("pokemonHeight");
    this.pokemonWeight = document.getElementById("pokemonWeight");
    this.pokemonAbilities = document.getElementById("pokemonAbilities");
    this.pokemonRegion = document.getElementById("pokemonRegion");
    this.pokemonStats = document.getElementById("pokemonStats");
    this.totalPokemonCount = document.getElementById("totalPokemonCount");
    this.screenLoader = document.getElementById("screenLoader");
    this.toastContainer = document.getElementById("toastContainer");

    this.prevPokemonBtn = document.getElementById("prevPokemonBtn");
    this.nextPokemonBtn = document.getElementById("nextPokemonBtn");
    this.pokemonCounter = document.getElementById("pokemonCounter");

    this.searchInput = document.getElementById("searchInput");
    this.searchType = document.getElementById("searchType");
    this.searchBtn = document.getElementById("searchBtn");

    this.speakBtn = document.getElementById("speakBtn");
    this.randomBtn = document.getElementById("randomBtn");
    this.listBtn = document.getElementById("listBtn");
    this.favoritesBtn = document.getElementById("favoritesBtn");
    this.compareBtn = document.getElementById("compareBtn");

    this.favoriteBtn = document.getElementById("favoriteBtn");
    this.toggleDarkMode = document.getElementById("toggleDarkMode");

    this.pokemonListContainer = document.getElementById(
      "pokemonListContainer",
    );
    this.pokemonList = document.getElementById("pokemonList");
    this.closeListBtn = document.getElementById("closeListBtn");
    this.listSearchInput = document.getElementById("listSearchInput");

    this.favoritesContainer = document.getElementById("favoritesContainer");
    this.favoritesList = document.getElementById("favoritesList");
    this.closeFavoritesBtn = document.getElementById("closeFavoritesBtn");

    this.compareContainer = document.getElementById("compareContainer");
    this.comparePokemon1 = document.getElementById("comparePokemon1");
    this.comparePokemon2 = document.getElementById("comparePokemon2");
    this.compareNowBtn = document.getElementById("compareNowBtn");
    this.compareResults = document.getElementById("compareResults");
    this.closeCompareBtn = document.getElementById("closeCompareBtn");

    this.themeButtons = document.querySelectorAll(".theme-btn");
  }

  initializeAudio() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    this.audioContext = new AudioCtx();

    // Navegadores modernos exigem um gesto do usuário para liberar o áudio
    const resumeAudio = () => {
      if (this.audioContext && this.audioContext.state === "suspended") {
        this.audioContext.resume();
      }
      document.removeEventListener("click", resumeAudio);
      document.removeEventListener("keydown", resumeAudio);
    };
    document.addEventListener("click", resumeAudio);
    document.addEventListener("keydown", resumeAudio);
  }

  initializeFemaleVoice() {
    this.voicePitch = 1.3;
    this.voiceRate = 0.9;

    if ("speechSynthesis" in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) return;

        this.femaleVoice = voices.find(
          (voice) =>
            voice.lang.includes("pt") &&
            (voice.name.toLowerCase().includes("female") ||
              voice.name.toLowerCase().includes("mulher") ||
              voice.name.toLowerCase().includes("feminina")),
        );

        if (!this.femaleVoice) {
          this.femaleVoice = voices.find((voice) => voice.lang.includes("pt"));
        }

        if (!this.femaleVoice) {
          this.femaleVoice = voices[0];
        }
      };

      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  // ========== SONS REALISTAS ==========

  playOpenSound() {
    this.playTone(880, 0, 0.15, "square");
    this.playTone(1100, 0.1, 0.15, "square");
    this.playTone(1320, 0.2, 0.3, "square");
    this.playTone(1760, 0.35, 0.4, "sine");
  }

  playCloseSound() {
    this.playTone(1760, 0, 0.15, "square");
    this.playTone(1320, 0.1, 0.15, "square");
    this.playTone(1100, 0.2, 0.2, "square");
    this.playTone(880, 0.3, 0.3, "sine");
  }

  playNavigationSound() {
    this.playTone(1000, 0, 0.08, "square");
  }

  playPokemonAppearSound() {
    this.playTone(600, 0, 0.1, "sine");
    this.playTone(800, 0.08, 0.1, "sine");
    this.playTone(1000, 0.16, 0.15, "sine");
    this.playTone(1200, 0.24, 0.2, "sine");
  }

  playErrorSound() {
    this.playTone(200, 0, 0.2, "sawtooth");
    this.playTone(150, 0.15, 0.3, "sawtooth");
  }

  playTone(frequency, startTime, duration, type = "sine") {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(
      0.15,
      this.audioContext.currentTime + startTime,
    );
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      this.audioContext.currentTime + startTime + duration,
    );

    oscillator.start(this.audioContext.currentTime + startTime);
    oscillator.stop(this.audioContext.currentTime + startTime + duration);
  }

  // ========== MENSAGENS (TOAST) ==========

  showToast(message, type = "info") {
    if (!this.toastContainer) {
      alert(message);
      return;
    }

    const toast = document.createElement("div");
    toast.className = `toast${type === "error" ? " error" : ""}`;
    toast.textContent = message;
    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = "toastOut 0.25s ease forwards";
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  }

  showLoader() {
    this.screenLoader?.classList.add("active");
  }

  hideLoader() {
    this.screenLoader?.classList.remove("active");
  }

  // ========== EVENTOS ==========

  addEventListeners() {
    this.closedPokedex.addEventListener("click", () => this.openPokedex());
    this.closedPokedex.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this.openPokedex();
      }
    });
    this.closePokedexBtn.addEventListener("click", () => this.closePokedex());

    // efeito de "segurar o aparelho" — leve inclinação 3D seguindo o mouse
    if (this.closedPokedexInner) {
      this.closedPokedex.addEventListener("mousemove", (e) => {
        const rect = this.closedPokedex.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        this.closedPokedexInner.style.transform = `scale(1.05) rotateY(${x * 16}deg) rotateX(${y * -16}deg)`;
      });
      this.closedPokedex.addEventListener("mouseleave", () => {
        this.closedPokedexInner.style.transform = "";
      });
    }

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.closePokedex();
      if (
        e.key === "ArrowLeft" &&
        this.pokedexContainer.classList.contains("open")
      ) {
        this.navigatePokemon(-1);
      }
      if (
        e.key === "ArrowRight" &&
        this.pokedexContainer.classList.contains("open")
      ) {
        this.navigatePokemon(1);
      }
    });

    this.prevPokemonBtn.addEventListener("click", () => {
      this.playNavigationSound();
      this.navigatePokemon(-1);
    });

    this.nextPokemonBtn.addEventListener("click", () => {
      this.playNavigationSound();
      this.navigatePokemon(1);
    });

    this.searchBtn.addEventListener("click", () => this.searchPokemon());
    this.searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.searchPokemon();
    });

    this.speakBtn.addEventListener("click", () => this.toggleSpeech());
    this.randomBtn.addEventListener("click", () => this.randomPokemon());
    this.listBtn.addEventListener("click", () => this.togglePokemonList());
    this.favoritesBtn.addEventListener("click", () => this.toggleFavorites());
    this.compareBtn.addEventListener("click", () => this.toggleCompare());

    this.favoriteBtn.addEventListener("click", () => this.toggleFavorite());
    this.toggleDarkMode.addEventListener("click", () =>
      this.toggleDarkModeFunc(),
    );

    this.closeListBtn.addEventListener("click", () =>
      this.togglePokemonList(),
    );
    this.closeFavoritesBtn.addEventListener("click", () =>
      this.toggleFavorites(),
    );
    this.closeCompareBtn.addEventListener("click", () => this.toggleCompare());

    this.listSearchInput.addEventListener(
      "input",
      debounce((e) => this.filterPokemonList(e.target.value), 200),
    );

    this.themeButtons.forEach((btn) => {
      btn.addEventListener("click", () => this.changeTheme(btn.dataset.theme));
    });

    this.compareNowBtn.addEventListener("click", () => this.comparePokemons());
  }

  // ========== ABRIR/FECHAR ==========

  async openPokedex() {
    this.closedPokedex.style.display = "none";
    this.pokedexContainer.classList.add("open");
    this.pokedexContainer.setAttribute("aria-hidden", "false");
    this.totalPokemonCount.textContent = `${this.totalPokemons} Pokémon disponíveis`;

    this.playOpenSound();

    await this.loadPokemon(this.currentPokemon);

    if (!this.isListLoaded) {
      this.loadAllPokemonList();
    }
  }

  closePokedex() {
    if (!this.pokedexContainer.classList.contains("open")) return;

    this.stopSpeaking();
    this.playCloseSound();
    this.pokedexContainer.setAttribute("aria-hidden", "true");

    setTimeout(() => {
      this.pokedexContainer.classList.remove("open");
      this.closedPokedex.style.display = "block";
    }, 400);
  }

  // ========== CARREGAR POKÉMON ==========

  async loadPokemon(idOrName) {
    const key =
      typeof idOrName === "string" ? slugify(idOrName) : idOrName;

    this.showLoader();

    try {
      let data = this.pokemonDataCache.get(key);

      if (!data) {
        const response = await fetch(
          `https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(key)}`,
        );
        if (!response.ok) throw new Error("Pokémon não encontrado!");
        data = await response.json();
        this.pokemonDataCache.set(key, data);
        this.pokemonDataCache.set(data.id, data);
        this.pokemonDataCache.set(data.name, data);
      }

      this.pokemonData = data;
      this.currentPokemon = data.id;

      await this.displayPokemon();
      this.playPokemonAppearSound();

      if (this.speechEnabled) {
        this.speakPokemonInfo();
      }
    } catch (error) {
      this.playErrorSound();
      this.showToast(error.message || "Erro ao carregar Pokémon.", "error");
    } finally {
      this.hideLoader();
    }
  }

  async displayPokemon() {
    if (!this.pokemonData) return;

    await this.loadPokemonImage(this.pokemonData);

    this.pokemonName.textContent = this.capitalizeFirstLetter(
      this.pokemonData.name,
    );
    this.pokemonNumber.textContent = `Nº ${String(this.pokemonData.id).padStart(3, "0")}`;

    const types = this.pokemonData.types
      .map((type) => this.translateTypeName(type.type.name))
      .join(", ");
    this.pokemonTypes.textContent = `Tipos: ${types}`;

    this.pokemonHeight.textContent = `Altura: ${(this.pokemonData.height / 10).toFixed(1)}m`;
    this.pokemonWeight.textContent = `Peso: ${(this.pokemonData.weight / 10).toFixed(1)}kg`;

    const abilities = this.pokemonData.abilities
      .map((ability) =>
        this.capitalizeFirstLetter(ability.ability.name.replace("-", " ")),
      )
      .join(", ");
    this.pokemonAbilities.textContent = `Habilidades: ${abilities}`;

    this.pokemonRegion.textContent = `Região: ${this.getPokemonRegion(this.pokemonData.id)}`;

    this.displayStats();
    this.updateFavoriteButton();

    this.pokemonCounter.textContent = `${this.currentPokemon}/${this.totalPokemons}`;
    this.prevPokemonBtn.disabled = this.currentPokemon <= 1;
    this.nextPokemonBtn.disabled = this.currentPokemon >= this.totalPokemons;
  }

  async loadPokemonImage(pokemonData) {
    const pokemonId = pokemonData.id;

    if (this.imageCache.has(pokemonId)) {
      this.pokemonImage.src = this.imageCache.get(pokemonId);
      return;
    }

    const imageSources = [
      pokemonData.sprites.other?.["official-artwork"]?.front_default,
      pokemonData.sprites.other?.home?.front_default,
      pokemonData.sprites.front_default,
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`,
    ];

    for (const src of imageSources) {
      if (src) {
        try {
          await this.tryLoadImage(src);
          this.imageCache.set(pokemonId, src);
          this.pokemonImage.src = src;
          return;
        } catch (error) {
          // tenta a próxima fonte de imagem disponível
        }
      }
    }
  }

  tryLoadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject();
      img.src = src;
    });
  }

  getPokemonRegion(id) {
    if (id <= 151) return "Kanto";
    if (id <= 251) return "Johto";
    if (id <= 386) return "Hoenn";
    if (id <= 493) return "Sinnoh";
    if (id <= 649) return "Unova";
    if (id <= 721) return "Kalos";
    if (id <= 809) return "Alola";
    if (id <= 905) return "Galar";
    return "Paldea";
  }

  displayStats() {
    const statsHTML = `
            <h3>Estatísticas Base</h3>
            ${this.pokemonData.stats
              .map((stat) => {
                const statName = this.translateStatName(stat.stat.name);
                const statValue = stat.base_stat;
                const percentage = Math.min((statValue / 255) * 100, 100);
                return `
                    <div class="stat-bar">
                        <span class="stat-name">${statName}</span>
                        <div class="stat-bar-fill">
                            <span style="width: ${percentage}%"></span>
                        </div>
                        <span class="stat-value">${statValue}</span>
                    </div>
                `;
              })
              .join("")}
        `;
    this.pokemonStats.innerHTML = statsHTML;
  }

  translateStatName(statName) {
    const translations = {
      hp: "HP",
      attack: "ATQ",
      defense: "DEF",
      "special-attack": "E.ATQ",
      "special-defense": "E.DEF",
      speed: "VEL",
    };
    return translations[statName] || statName.toUpperCase();
  }

  // ========== FAVORITOS ==========

  toggleFavorite() {
    if (!this.pokemonData) return;

    const pokemonId = this.pokemonData.id;
    const index = this.favorites.indexOf(pokemonId);

    if (index > -1) {
      this.favorites.splice(index, 1);
    } else {
      this.favorites.push(pokemonId);
    }

    localStorage.setItem("pokemonFavorites", JSON.stringify(this.favorites));
    this.updateFavoriteButton();
    this.playNavigationSound();
  }

  updateFavoriteButton() {
    if (!this.pokemonData) return;

    const isFavorite = this.favorites.includes(this.pokemonData.id);
    this.favoriteBtn.textContent = isFavorite ? "★" : "☆";
    this.favoriteBtn.classList.toggle("active", isFavorite);
    this.favoriteBtn.setAttribute(
      "aria-label",
      isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos",
    );
  }

  toggleFavorites() {
    const isVisible = this.favoritesContainer.style.display !== "none";
    this.favoritesContainer.style.display = isVisible ? "none" : "block";

    if (!isVisible) {
      this.displayFavorites();
    }
  }

  displayFavorites() {
    const items = this.favorites.map((id) =>
      this.createListItem(id, {
        className: "favorite-item",
        onSelect: (id) => {
          this.loadPokemon(id);
          this.toggleFavorites();
        },
      }),
    );
    this.renderList(this.favoritesList, items, "Nenhum Pokémon favorito ainda!");
  }

  // ========== COMPARAÇÃO ==========

  toggleCompare() {
    const isVisible = this.compareContainer.style.display !== "none";
    this.compareContainer.style.display = isVisible ? "none" : "block";
  }

  async comparePokemons() {
    const pokemon1 = slugify(this.comparePokemon1.value);
    const pokemon2 = slugify(this.comparePokemon2.value);

    if (!pokemon1 || !pokemon2) {
      this.showToast("Digite os dois Pokémon para comparar!", "error");
      return;
    }

    try {
      const [data1, data2] = await Promise.all([
        fetch(
          `https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(pokemon1)}`,
        ).then((r) => {
          if (!r.ok) throw new Error("not found");
          return r.json();
        }),
        fetch(
          `https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(pokemon2)}`,
        ).then((r) => {
          if (!r.ok) throw new Error("not found");
          return r.json();
        }),
      ]);

      this.compareResults.innerHTML = `
                <div class="compare-pokemon">
                    <h3>${this.capitalizeFirstLetter(data1.name)}</h3>
                    <img src="${data1.sprites.other?.["official-artwork"]?.front_default ?? data1.sprites.front_default}" alt="${data1.name}">
                    ${this.getCompareStats(data1)}
                </div>
                <div class="compare-pokemon">
                    <h3>${this.capitalizeFirstLetter(data2.name)}</h3>
                    <img src="${data2.sprites.other?.["official-artwork"]?.front_default ?? data2.sprites.front_default}" alt="${data2.name}">
                    ${this.getCompareStats(data2)}
                </div>
            `;
    } catch (error) {
      this.showToast(
        "Não foi possível comparar — verifique os nomes/IDs digitados.",
        "error",
      );
    }
  }

  getCompareStats(pokemonData) {
    const statValue = (name) =>
      pokemonData.stats.find((s) => s.stat.name === name)?.base_stat ?? 0;

    const hp = statValue("hp");
    const attack = statValue("attack");
    const defense = statValue("defense");
    const spAttack = statValue("special-attack");
    const spDefense = statValue("special-defense");
    const speed = statValue("speed");
    const total = hp + attack + defense + spAttack + spDefense + speed;

    return `
            <p><strong>HP:</strong> ${hp}</p>
            <p><strong>Ataque:</strong> ${attack}</p>
            <p><strong>Defesa:</strong> ${defense}</p>
            <p><strong>Ataque Esp.:</strong> ${spAttack}</p>
            <p><strong>Defesa Esp.:</strong> ${spDefense}</p>
            <p><strong>Velocidade:</strong> ${speed}</p>
            <p><strong>Total:</strong> ${total}</p>
        `;
  }

  // ========== BUSCA AVANÇADA ==========

  async searchPokemon() {
    const rawTerm = this.searchInput.value.trim();
    const searchType = this.searchType.value;

    if (!rawTerm) return;

    const searchTerm = slugify(rawTerm);

    if (searchType === "name") {
      await this.loadPokemon(searchTerm);
    } else if (searchType === "type") {
      await this.searchByType(searchTerm);
    } else if (searchType === "ability") {
      await this.searchByAbility(searchTerm);
    } else if (searchType === "region") {
      await this.searchByRegion(searchTerm);
    }

    this.searchInput.value = "";
  }

  async searchByType(type) {
    try {
      this.showLoader();
      const response = await fetch(
        `https://pokeapi.co/api/v2/type/${encodeURIComponent(type)}`,
      );
      if (!response.ok) throw new Error("not found");
      const data = await response.json();
      const pokemonList = data.pokemon.slice(0, 50); // Primeiros 50
      this.displaySearchResults(pokemonList.map((p) => p.pokemon));
    } catch (error) {
      this.showToast("Tipo não encontrado!", "error");
    } finally {
      this.hideLoader();
    }
  }

  async searchByAbility(ability) {
    try {
      this.showLoader();
      const response = await fetch(
        `https://pokeapi.co/api/v2/ability/${encodeURIComponent(ability)}`,
      );
      if (!response.ok) throw new Error("not found");
      const data = await response.json();
      const pokemonList = data.pokemon.slice(0, 50);
      this.displaySearchResults(pokemonList.map((p) => p.pokemon));
    } catch (error) {
      this.showToast("Habilidade não encontrada!", "error");
    } finally {
      this.hideLoader();
    }
  }

  async searchByRegion(region) {
    const regionRanges = {
      kanto: [1, 151],
      johto: [152, 251],
      hoenn: [252, 386],
      sinnoh: [387, 493],
      unova: [494, 649],
      kalos: [650, 721],
      alola: [722, 809],
      galar: [810, 905],
      paldea: [906, 1025],
    };

    const range = regionRanges[region];
    if (!range) {
      this.showToast("Região não encontrada!", "error");
      return;
    }

    this.displaySearchResultsByRange(range[0], range[1]);
  }

  extractIdFromUrl(url) {
    const match = url.match(/\/(\d+)\/?$/);
    return match ? match[1] : null;
  }

  // Monta um item de lista (usado pela lista completa, busca, região e
  // favoritos) — só muda o que é passado em `options`.
  createListItem(id, { name, showNumber = false, className = "pokemon-list-item", onSelect }) {
    const numberLabel = `#${String(id).padStart(3, "0")}`;
    const label = name || numberLabel;

    const item = document.createElement("div");
    item.className = className;
    item.setAttribute("role", "listitem");
    item.innerHTML = `
      ${showNumber ? `<span class="pokemon-number">${numberLabel}</span>` : ""}
      <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png" alt="${label}" loading="lazy">
      <span>${label}</span>
    `;
    item.addEventListener("click", () => onSelect(id));
    return item;
  }

  renderList(container, items, emptyMessage) {
    container.innerHTML = "";
    if (!items || items.length === 0) {
      container.innerHTML = `<p class="list-empty-message">${emptyMessage}</p>`;
      return;
    }
    items.forEach((item) => container.appendChild(item));
  }

  selectSearchResult(id) {
    this.loadPokemon(id);
    this.pokemonListContainer.style.display = "none";
  }

  displaySearchResults(pokemonList) {
    this.pokemonListContainer.style.display = "block";

    const items = pokemonList
      .map((pokemon) => {
        const id = this.extractIdFromUrl(pokemon.url);
        if (!id) return null;
        return this.createListItem(Number(id), {
          name: this.capitalizeFirstLetter(pokemon.name),
          onSelect: (id) => this.selectSearchResult(id),
        });
      })
      .filter(Boolean);

    this.renderList(this.pokemonList, items, "Nenhum resultado encontrado.");
  }

  displaySearchResultsByRange(start, end) {
    this.pokemonListContainer.style.display = "block";

    const items = [];
    for (let id = start; id <= end; id++) {
      items.push(
        this.createListItem(id, { onSelect: (id) => this.selectSearchResult(id) }),
      );
    }

    this.renderList(this.pokemonList, items, "Nenhum resultado encontrado.");
  }

  // ========== LISTA ==========

  async loadAllPokemonList() {
    try {
      const response = await fetch(
        `https://pokeapi.co/api/v2/pokemon?limit=${this.totalPokemons}`,
      );
      const data = await response.json();
      this.allPokemonList = data.results;
      this.isListLoaded = true;
      this.displayPokemonList(this.allPokemonList);
    } catch (error) {
      console.error("Erro ao carregar lista:", error);
      this.showToast("Erro ao carregar a lista completa.", "error");
    }
  }

  displayPokemonList(pokemonList) {
    const items = (pokemonList || [])
      .map((pokemon) => {
        const id = this.extractIdFromUrl(pokemon.url);
        if (!id) return null;
        return this.createListItem(Number(id), {
          name: this.capitalizeFirstLetter(pokemon.name),
          showNumber: true,
          onSelect: (id) => {
            this.loadPokemon(id);
            this.togglePokemonList();
          },
        });
      })
      .filter(Boolean);

    this.renderList(this.pokemonList, items, "Nenhum Pokémon encontrado.");
  }

  filterPokemonList(term) {
    const query = term.trim().toLowerCase();
    if (!this.isListLoaded) return;

    const filtered = query
      ? this.allPokemonList.filter((p) => p.name.toLowerCase().includes(query))
      : this.allPokemonList;

    this.displayPokemonList(filtered);
  }

  togglePokemonList() {
    const isVisible = this.pokemonListContainer.style.display !== "none";
    this.pokemonListContainer.style.display = isVisible ? "none" : "block";

    if (!isVisible && !this.isListLoaded) {
      this.loadAllPokemonList();
    }
  }

  // ========== TEMAS ==========

  changeTheme(theme) {
    this.currentTheme = theme;
    this.pokedexTheme.className = `pokedex theme-${theme}`;

    this.themeButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.theme === theme);
    });

    this.playNavigationSound();
  }

  toggleDarkModeFunc() {
    this.darkMode = !this.darkMode;
    document.body.classList.toggle("dark-mode", this.darkMode);
    this.toggleDarkMode.textContent = this.darkMode ? "☀️" : "🌙";
    localStorage.setItem("darkMode", this.darkMode);
  }

  // ========== NAVEGAÇÃO ==========

  navigatePokemon(direction) {
    const newId = this.currentPokemon + direction;
    if (newId >= 1 && newId <= this.totalPokemons) {
      this.loadPokemon(newId);
    }
  }

  randomPokemon() {
    const randomId = Math.floor(Math.random() * this.totalPokemons) + 1;
    this.loadPokemon(randomId);
  }

  // ========== FALA ==========

  speakPokemonInfo() {
    if (!this.pokemonData || !this.speechEnabled) return;

    this.stopSpeaking();

    if ("speechSynthesis" in window) {
      const speechText = `
                ${this.capitalizeFirstLetter(this.pokemonData.name)}.
                Número ${this.pokemonData.id} da Pokédex.
                Tipos: ${this.pokemonData.types.map((type) => this.translateTypeName(type.type.name)).join(", ")}.
                Altura: ${(this.pokemonData.height / 10).toFixed(1)} metros.
                Peso: ${(this.pokemonData.weight / 10).toFixed(1)} quilogramas.
                Região: ${this.getPokemonRegion(this.pokemonData.id)}.
            `;

      const speech = new SpeechSynthesisUtterance(speechText);
      speech.lang = "pt-BR";
      speech.voice = this.femaleVoice;
      speech.pitch = this.voicePitch;
      speech.rate = this.voiceRate;

      window.speechSynthesis.speak(speech);
    }
  }

  stopSpeaking() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  toggleSpeech() {
    this.speechEnabled = !this.speechEnabled;
    this.speakBtn.textContent = this.speechEnabled
      ? "🔊 Fala: ON"
      : "🔇 Fala: OFF";

    if (this.speechEnabled && this.pokemonData) {
      this.speakPokemonInfo();
    } else {
      this.stopSpeaking();
    }
  }

  translateTypeName(typeName) {
    const translations = {
      normal: "Normal",
      fire: "Fogo",
      water: "Água",
      electric: "Elétrico",
      grass: "Planta",
      ice: "Gelo",
      fighting: "Lutador",
      poison: "Veneno",
      ground: "Terra",
      flying: "Voador",
      psychic: "Psíquico",
      bug: "Inseto",
      rock: "Pedra",
      ghost: "Fantasma",
      dragon: "Dragão",
      dark: "Sombrio",
      steel: "Aço",
      fairy: "Fada",
    };
    return translations[typeName] || this.capitalizeFirstLetter(typeName);
  }

  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
}

// ========== FUNDO DINÂMICO ==========
// Gera uma textura de "chão" diferente a cada carregamento da página,
// como se a Pokédex estivesse sendo segurada na mão e apontada para baixo.

function generateGroundBackground() {
  const target = document.getElementById("groundBackground");
  if (!target) return;

  const terrains = [
    { base: ["#4f8c2b", "#3b6b1f", "#22400f"], speck: "#8fd05a", shape: "blade" },
    { base: ["#8a6339", "#6b4a2a", "#3a2513"], speck: "#c69760", shape: "dot" },
    { base: ["#d8c087", "#c7a866", "#a9854a"], speck: "#efe0b3", shape: "dot" },
    { base: ["#7d8288", "#5c6166", "#33373c"], speck: "#a7adb3", shape: "dot" },
    { base: ["#5c481f", "#453519", "#2a200e"], speck: "#c98f34", shape: "leaf" },
    { base: ["#e8eef2", "#d3dee6", "#aebfca"], speck: "#ffffff", shape: "dot" },
  ];
  const terrain = terrains[Math.floor(Math.random() * terrains.length)];

  const size = 640;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // luz incidindo de um ponto (como se o "farol" da Pokédex iluminasse o chão)
  const lightX = size * (0.35 + Math.random() * 0.3);
  const lightY = size * (0.25 + Math.random() * 0.25);
  const gradient = ctx.createRadialGradient(
    lightX,
    lightY,
    size * 0.04,
    size * 0.5,
    size * 0.5,
    size * 0.78,
  );
  gradient.addColorStop(0, terrain.base[0]);
  gradient.addColorStop(0.55, terrain.base[1]);
  gradient.addColorStop(1, terrain.base[2]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // grão / textura geral
  for (let i = 0; i < 2400; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.globalAlpha = 0.05 + Math.random() * 0.1;
    ctx.fillStyle = terrain.base[Math.floor(Math.random() * terrain.base.length)];
    ctx.beginPath();
    ctx.arc(x, y, 1 + Math.random() * 2.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // detalhes característicos do terreno (grama, folhas, pedrinhas...)
  for (let i = 0; i < 260; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.fillStyle = terrain.speck;
    ctx.strokeStyle = terrain.speck;

    if (terrain.shape === "blade") {
      const h = 6 + Math.random() * 10;
      const lean = (Math.random() - 0.5) * 6;
      ctx.globalAlpha = 0.22 + Math.random() * 0.28;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + lean, y - h / 2, x + lean * 1.5, y - h);
      ctx.stroke();
    } else if (terrain.shape === "leaf") {
      ctx.globalAlpha = 0.28 + Math.random() * 0.3;
      ctx.beginPath();
      ctx.ellipse(
        x,
        y,
        3 + Math.random() * 3,
        1.4 + Math.random() * 2,
        Math.random() * Math.PI,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    } else {
      ctx.globalAlpha = 0.18 + Math.random() * 0.32;
      ctx.beginPath();
      ctx.arc(x, y, 1 + Math.random() * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  // sombra suave de quem segura o aparelho, projetada no chão
  const shadow = ctx.createRadialGradient(
    size * 0.5,
    size * 0.7,
    size * 0.04,
    size * 0.5,
    size * 0.7,
    size * 0.32,
  );
  shadow.addColorStop(0, "rgba(0,0,0,0.32)");
  shadow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = shadow;
  ctx.fillRect(0, 0, size, size);

  target.style.backgroundImage = `url(${canvas.toDataURL("image/png")})`;
}

// Inicializar
document.addEventListener("DOMContentLoaded", () => {
  generateGroundBackground();

  const pokedex = new Pokedex();

  // Kanto (Geração 1) é sempre o tema inicial — o seletor de temas
  // continua disponível para trocar durante a sessão.

  // Restaurar modo noturno
  const savedDarkMode = localStorage.getItem("darkMode");
  if (savedDarkMode === "true") {
    pokedex.toggleDarkModeFunc();
  }
});
