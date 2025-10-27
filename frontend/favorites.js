// Check authentication
if (!localStorage.getItem('token')) {
    window.location.href = 'index.html';
}

async function loadFavorites() {
    const listDiv = document.getElementById('favoritesList');
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/favorites', {
            headers: {
                'Authorization': token
            }
        });
        
        if (response.ok) {
            const favorites = await response.json();
            listDiv.innerHTML = '';
            
            if (favorites.length === 0) {
                listDiv.innerHTML = '<p class="no-favorites">No favorite Pokémon added yet!</p>';
                return;
            }

            favorites.forEach(pokemon => {
                listDiv.innerHTML += `
                    <div class="pokemon-card">
                        <img src="${pokemon.sprite}" alt="${pokemon.name}">
                        <h3>#${String(pokemon.pokemonId).padStart(3, '0')} ${pokemon.name}</h3>
                    </div>
                `;
            });
        } else {
            console.error('Error fetching favorites');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
}

// Load favorites when page loads
document.addEventListener('DOMContentLoaded', loadFavorites);