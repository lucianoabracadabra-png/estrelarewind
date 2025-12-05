// ============================================
// VARIÁVEIS GLOBAIS
// ============================================
const NUM_PHOTOS = 12;
let currentIndex = -1;
let photos = [];
let photoPositions = [];
let starPhotoPositions = []; // Posições diferentes para modo estrela
let isAnimating = false;
let isStarMode = false; // Toggle para ambiente da estrela

// Gerar array de fotos
for (let i = 1; i <= NUM_PHOTOS; i++) {
    photos.push(`fotos/${i}.jpg`);
}

// ============================================
// ELEMENTOS DO DOM
// ============================================
const counterMode = document.getElementById('counterMode');
const galleryMode = document.getElementById('galleryMode');
const counterSurface = document.getElementById('counterSurface');
const galleryGrid = document.getElementById('galleryGrid');
const counterBtn = document.getElementById('counterBtn');
const galleryBtn = document.getElementById('galleryBtn');
const starBtn = document.getElementById('starBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const counter = document.getElementById('counter');

// ============================================
// INICIALIZAÇÃO DE POSIÇÕES
// ============================================
function generatePositions() {
    // Gera posições aleatórias uma única vez
    photoPositions = photos.map((photo, idx) => {
        const angle = (idx / photos.length) * Math.PI * 2 + Math.random() * 0.5;
        const distance = 300 + Math.random() * 250;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        const rotation = -25 + Math.random() * 50;
        
        return { x, y, rotation };
    });

    // Gera posições DIFERENTES para o modo estrela
    starPhotoPositions = photos.map((photo, idx) => {
        const angle = (idx / photos.length) * Math.PI * 2 + Math.random() * 0.5;
        const distance = 300 + Math.random() * 250;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        const rotation = -25 + Math.random() * 50;
        
        return { x, y, rotation };
    });
}

// ============================================
// BANCADA - GERAÇÃO INICIAL (NOVA LÓGICA)
// ============================================
function initScatteredPhotos() {
    // Limpa a bancada
    counterSurface.innerHTML = '';
    
    // Define qual array de posições usar
    const positions = isStarMode ? starPhotoPositions : photoPositions;
    
    // Cria TODAS as fotos na bancada de uma vez só
    photos.forEach((photo, idx) => {
        // Adiciona prefixo "e" se estiver em modo estrela
        const photoPath = isStarMode ? `fotos/e${idx + 1}.jpg` : photo;
        
        const polaroid = document.createElement('div');
        polaroid.className = 'polaroid scattered-polaroid';
        polaroid.innerHTML = `<img src="${photoPath}" alt="Foto ${idx + 1}" class="polaroid-img">`;
        polaroid.dataset.index = idx; // Identificador importante
        
        const pos = positions[idx];
        
        // Posicionamento absoluto baseado no centro
        polaroid.style.left = `calc(50% + ${pos.x}px)`;
        polaroid.style.top = `calc(50% + ${pos.y}px)`;
        polaroid.style.transform = `translate(-50%, -50%) rotate(${pos.rotation}deg)`;
        
        // Z-Index aleatório para dar sensação de bagunça
        polaroid.style.zIndex = Math.floor(Math.random() * 10);

        // Evento de clique
        polaroid.addEventListener('click', () => {
            if (galleryMode.classList.contains('active')) {
                // Se galeria aberta, só atualiza o foco
                currentIndex = idx;
                updateGalleryView();
                updateScatteredVisibility(); // Atualiza opacidade atrás da galeria
            } else {
                // Se bancada, abre o detalhe
                if (currentIndex === -1) {
                    openDetail(idx);
                } else if (currentIndex !== idx) {
                    changePhoto(idx);
                }
            }
        });

        counterSurface.appendChild(polaroid);
    });
}

// ============================================
// CONTROLE DE VISIBILIDADE (O SEGREDO DO FIX)
// ============================================
function updateScatteredVisibility() {
    // Em vez de remover elementos, apenas escondemos (opacity 0) a carta que está aberta
    const allScattered = document.querySelectorAll('.scattered-polaroid');
    
    allScattered.forEach(card => {
        const idx = parseInt(card.dataset.index);
        
        if (idx === currentIndex && currentIndex !== -1) {
            // Se esta é a carta aberta, esconde ela da bagunça
            card.classList.add('hide-for-detail');
        } else {
            // Todas as outras devem aparecer
            card.classList.remove('hide-for-detail');
        }
    });

    // Atualiza contador
    if (currentIndex === -1) {
        counter.textContent = `Selecione uma foto`;
        counterMode.classList.remove('detail-view');
    } else {
        counter.textContent = `${currentIndex + 1} / ${photos.length}`;
        counterMode.classList.add('detail-view');
    }
}

// ============================================
// EVENT LISTENERS - MODO
// ============================================
counterBtn.addEventListener('click', () => {
    counterMode.classList.add('active');
    galleryMode.classList.remove('active');
    counterBtn.classList.add('active');
    galleryBtn.classList.remove('active');
    starBtn.classList.remove('active');
    updateScatteredVisibility();
});

galleryBtn.addEventListener('click', () => {
    counterMode.classList.remove('active');
    galleryMode.classList.add('active');
    galleryBtn.classList.add('active');
    counterBtn.classList.remove('active');
    starBtn.classList.remove('active');
    updateGalleryView();
    updateScatteredVisibility();
});

starBtn.addEventListener('click', () => {
    // Toggle do modo estrela
    isStarMode = !isStarMode;
    
    // Atualiza o título do botão
    if (isStarMode) {
        starBtn.classList.add('active');
        starBtn.textContent = 'Estrela';
    } else {
        starBtn.classList.remove('active');
        starBtn.textContent = 'Inove';
    }
    
    // Recarrega as fotos com o novo prefixo
    if (counterMode.classList.contains('active')) {
        initScatteredPhotos();
        updateScatteredVisibility();
    } else if (galleryMode.classList.contains('active')) {
        currentIndex = -1;
        updateGalleryView();
        updateScatteredVisibility();
    }
});

// ============================================
// GALERIA - VISUALIZAÇÃO
// ============================================
function updateGalleryView() {
    // Se havia uma carta central aberta na bancada, remova ela para não ficar duplicada
    const existingCenter = document.querySelector('.center-polaroid');
    if (existingCenter) existingCenter.remove();

    galleryGrid.innerHTML = '';
    
    if (currentIndex === -1) currentIndex = 0;

    const prevIndex = (currentIndex - 1 + photos.length) % photos.length;
    const nextIndex = (currentIndex + 1) % photos.length;

    // Função auxiliar para criar card da galeria
    const createGalleryCard = (index, type) => {
        const div = document.createElement('div');
        div.className = `polaroid ${type}`;
        // Adiciona prefixo "e" se estiver em modo estrela
        const photoPath = isStarMode ? `fotos/e${index + 1}.jpg` : photos[index];
        div.innerHTML = `<img src="${photoPath}" class="polaroid-img">`;
        div.addEventListener('click', () => {
            if(type === 'current') {
                counterBtn.click(); // Vai para bancada
            } else {
                currentIndex = index;
                updateGalleryView();
                updateScatteredVisibility(); // Sincroniza fundo
            }
        });
        return div;
    };

    galleryGrid.appendChild(createGalleryCard(prevIndex, ''));
    galleryGrid.appendChild(createGalleryCard(currentIndex, 'current'));
    galleryGrid.appendChild(createGalleryCard(nextIndex, ''));
}

// ============================================
// DETALHE - ABRIR (CORREÇÃO DE CONFLITO CSS)
// ============================================
function openDetail(idx) {
    if (isAnimating) return;
    isAnimating = true;

    currentIndex = idx;
    
    // Define qual array de posições usar
    const positions = isStarMode ? starPhotoPositions : photoPositions;
    const pos = positions[idx];
    
    // Adiciona prefixo "e" se estiver em modo estrela
    const photoPath = isStarMode ? `fotos/e${idx + 1}.jpg` : photos[idx];

    // 1. Esconde a carta da bancada
    updateScatteredVisibility();

    // 2. Cria a carta central
    const centerCard = document.createElement('div');
    centerCard.className = 'polaroid center-polaroid';
    centerCard.innerHTML = `<img src="${photoPath}" alt="Foto central" class="polaroid-img">`;
    centerCard.dataset.index = idx;
    centerCard.addEventListener('click', closeDetail);

    // =================================================================
    // CORREÇÃO CRÍTICA AQUI:
    // Matamos a animação "slideIn" do CSS para que ela não interfira
    // na nossa animação manual de coordenadas.
    centerCard.style.animation = 'none'; 
    // =================================================================

    // 3. SETUP INICIAL (Posição exata da bancada)
    centerCard.style.position = 'absolute';
    centerCard.style.left = '50%';
    centerCard.style.top = '50%';
    centerCard.style.zIndex = 100;
    centerCard.style.transition = 'none'; // Importante: sem transição no start

    // Posiciona onde a original estava
    centerCard.style.transform = `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px) rotate(${pos.rotation}deg) scale(0.5)`;

    counterSurface.appendChild(centerCard);

    // 4. FORÇAR REFLOW (Obrigatório)
    centerCard.offsetHeight; 

    // 5. ANIMAR PARA O CENTRO
    centerCard.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
    centerCard.classList.add('visible');
    
    // Vai para o centro
    centerCard.style.transform = `translate(-50%, -50%) translate(0px, 0px) rotate(0deg) scale(1)`;

    setTimeout(() => {
        isAnimating = false;
    }, 650);
}

// ============================================
// DETALHE - FECHAR (CENTRO -> ORIGEM)
// ============================================
function closeDetail() {
    if (isAnimating || currentIndex === -1) return;
    isAnimating = true;

    const centerCard = document.querySelector('.center-polaroid');
    const closingIndex = currentIndex;
    
    // Define qual array de posições usar
    const positions = isStarMode ? starPhotoPositions : photoPositions;
    const pos = positions[closingIndex]; // Pega a posição de destino

    if (centerCard) {
        centerCard.classList.remove('visible');
        centerCard.style.animation = 'none'; // Remove animações CSS se houver
        
        // Configura a transição suave
        centerCard.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
        
        // VOLTA PARA A ORIGEM
        // Usamos as mesmas coordenadas de quando abrimos
        centerCard.style.transform = `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px) rotate(${pos.rotation}deg) scale(0.5)`;
    }

    setTimeout(() => {
        // Remove a carta animada
        if (centerCard) centerCard.remove();

        // Reseta o estado
        currentIndex = -1;
        
        // Faz a carta estática da bancada reaparecer
        updateScatteredVisibility(); 

        isAnimating = false;
    }, 600);
}
// ============================================
// TROCAR FOTO (CORREÇÃO DE CONFLITO CSS)
// ============================================
function changePhoto(newIndex) {
    if (isAnimating || currentIndex === -1 || newIndex === currentIndex) return;
    
    isAnimating = true;
    const oldIndex = currentIndex;
    const centerCard = document.querySelector('.center-polaroid');
    
    // Define qual array de posições usar
    const positions = isStarMode ? starPhotoPositions : photoPositions;
    const oldPos = positions[oldIndex];
    const newPos = positions[newIndex];
    
    // Adiciona prefixo "e" se estiver em modo estrela
    const newPhotoPath = isStarMode ? `fotos/e${newIndex + 1}.jpg` : photos[newIndex];

    // FASE 1: Manda a velha embora
    if (centerCard) {
        centerCard.classList.remove('visible');
        centerCard.style.animation = 'none'; // Garante que o CSS não interfira na saída também
        centerCard.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
        centerCard.style.zIndex = 40;
        
        // Volta para origem
        centerCard.style.transform = `translate(-50%, -50%) translate(${oldPos.x}px, ${oldPos.y}px) rotate(${oldPos.rotation}deg) scale(0.5)`;
    }

    // FASE 2: Traz a nova
    setTimeout(() => {
        if (centerCard) centerCard.remove();
        
        currentIndex = newIndex;
        updateScatteredVisibility();

        const newCenterCard = document.createElement('div');
        newCenterCard.className = 'polaroid center-polaroid';
        newCenterCard.innerHTML = `<img src="${newPhotoPath}" alt="Foto central" class="polaroid-img">`;
        newCenterCard.dataset.index = newIndex;
        newCenterCard.addEventListener('click', closeDetail);

        // CORREÇÃO CRÍTICA AQUI TAMBÉM:
        newCenterCard.style.animation = 'none';

        // Setup Inicial
        newCenterCard.style.position = 'absolute';
        newCenterCard.style.left = '50%';
        newCenterCard.style.top = '50%';
        newCenterCard.style.zIndex = 100;
        newCenterCard.style.transition = 'none';
        
        // Posição de origem
        newCenterCard.style.transform = `translate(-50%, -50%) translate(${newPos.x}px, ${newPos.y}px) rotate(${newPos.rotation}deg) scale(0.5)`;

        counterSurface.appendChild(newCenterCard);

        newCenterCard.offsetHeight; // Reflow

        // Animação final
        newCenterCard.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
        newCenterCard.classList.add('visible');
        newCenterCard.style.transform = `translate(-50%, -50%) translate(0px, 0px) rotate(0deg) scale(1)`;

        setTimeout(() => {
            isAnimating = false;
        }, 650);

    }, 150);
}

// ============================================
// NAVEGAÇÃO
// ============================================
prevBtn.addEventListener('click', () => {
    if (currentIndex === -1) return;
    const newIndex = (currentIndex - 1 + photos.length) % photos.length;
    changePhoto(newIndex);
});

nextBtn.addEventListener('click', () => {
    if (currentIndex === -1) return;
    const newIndex = (currentIndex + 1) % photos.length;
    changePhoto(newIndex);
});

// Teclado
document.addEventListener('keydown', (e) => {
    if (currentIndex !== -1) {
        if (e.key === 'ArrowLeft') {
            const newIndex = (currentIndex - 1 + photos.length) % photos.length;
            changePhoto(newIndex);
        }
        if (e.key === 'ArrowRight') {
            const newIndex = (currentIndex + 1) % photos.length;
            changePhoto(newIndex);
        }
        if (e.key === 'Escape') {
            closeDetail();
        }
    }
});

// Fechar ao clicar fora
counterSurface.addEventListener('click', (e) => {
    if (currentIndex !== -1 && e.target === counterSurface) {
        closeDetail();
    }
});

// ============================================
// INICIALIZAÇÃO
// ============================================
generatePositions();
initScatteredPhotos(); // Gera as fotos UMA única vez

updateScatteredVisibility(); // Aplica estado inicial
