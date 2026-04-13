// Verificar autenticación
if (!localStorage.getItem('token')) {
    window.location.href = 'index.html';
}

// Cargar lista inicial de Pokemon
let allPokemon = []; // Variable para almacenar todos los pokemon
async function loadPokemonList() {
    const listDiv = document.getElementById('pokemonList');
    try {
        const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=20');
        const data = await response.json();
        
        listDiv.innerHTML = '';
        allPokemon = []; // Limpiar el array

        for (const pokemon of data.results) {
            const pokemonResponse = await fetch(pokemon.url);
            const pokemonData = await pokemonResponse.json();
            allPokemon.push(pokemonData); // Guardar los datos
            
            listDiv.innerHTML += `
                <div class="pokemon-card">
                    <img src="${pokemonData.sprites.front_default}" alt="${pokemonData.name}">
                    <h3>#${String(pokemonData.id).padStart(3, '0')} ${pokemonData.name}</h3>
                    <button class="favorite-btn" onclick="addToFavorites(${pokemonData.id}, '${pokemonData.name}', '${pokemonData.sprites.front_default}')">
                        Add to Favorites
                    </button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function filterPokemon(searchTerm) {
    const listDiv = document.getElementById('pokemonList');
    const filteredPokemon = allPokemon.filter(pokemon => 
        pokemon.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    listDiv.innerHTML = '';
    filteredPokemon.forEach(pokemon => {
        listDiv.innerHTML += `
            <div class="pokemon-card">
                <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
                <h3>${pokemon.name}</h3>
            </div>
        `;
    });
}

// Reemplazar la función searchPokemon anterior
function searchPokemon() {
    const searchInput = document.getElementById('searchInput').value;
    filterPokemon(searchInput);
}

// Agregar evento para búsqueda en tiempo real
document.addEventListener('DOMContentLoaded', () => {
    loadPokemonList();
    document.getElementById('searchInput').addEventListener('input', (e) => {
        filterPokemon(e.target.value);
    });
});

async function addToFavorites(pokemonId, name, sprite) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/favorites', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ pokemonId, name, sprite })
        });
        
        if (response.ok) {
            alert('Added to favorites!');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
}
