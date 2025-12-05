// ============================================
// VARIÁVEIS GLOBAIS
// ============================================
let currentIndex = -1;
let photos = [];
let estrelaPhotos = [];
let photoPositions = [];
let starPhotoPositions = [];
let isAnimating = false;
let isStarMode = false;
let NUM_PHOTOS = 0;
let NUM_ESTRELA = 0;

// ============================================
// DETECTAR FOTOS NA PASTA
// ============================================
async function loadPhotos() {
    try {
        // Lista manual das fotos - você atualiza aqui conforme adiciona
        const inovePhotos = [];
        const estrelaPhotos = [];
        
        // Tenta carregar fotos testando se existem
        // Inicia com um número máximo para teste
        let inoveCount = 0;
        let estrelaCount = 0;
        
        // Cria imagens de teste para verificar
        for (let i = 1; i <= 20; i++) {
            const img = new Image();
            img.src = `fotos/${i}.jpg`;
            
            // Se carregar com sucesso, adiciona
            await new Promise((resolve) => {
                img.onload = () => {
                    inovePhotos.push(`fotos/${i}.jpg`);
                    inoveCount++;
                    resolve();
                };
                img.onerror = () => {
                    resolve();
                };
                // Timeout para não travar
                setTimeout(resolve, 1000);
            });
        }
        
        // Mesmo para Estrela
        for (let i = 1; i <= 20; i++) {
            const img = new Image();
            img.src = `fotos/e${i}.jpg`;
            
            await new Promise((resolve) => {
                img.onload = () => {
                    estrelaPhotos.push(`fotos/e${i}.jpg`);
                    estrelaCount++;
                    resolve();
                };
                img.onerror = () => {
                    resolve();
                };
                setTimeout(resolve, 1000);
            });
        }
        
        // Se encontrou fotos Inove
        if (inovePhotos.length > 0) {
            photos = inovePhotos;
            // Guarda as fotos Estrela globalmente
            window.estrelaPhotos = estrelaPhotos;
            NUM_PHOTOS = photos.length;
            NUM_ESTRELA = estrelaPhotos.length;
            console.log(`✓ Carregadas ${NUM_PHOTOS} fotos Inove:`, inovePhotos);
            console.log(`✓ Detectadas ${NUM_ESTRELA} fotos Estrela:`, estrelaPhotos);
            return true;
        } else {
            throw new Error('Nenhuma foto encontrada');
        }
        
    } catch (error) {
        console.error('Erro ao detectar fotos:', error);
        return false;
    }
}

// Fallback: Carregar fotos manualmente se a detecção falhar
function loadPhotosManual() {
    photos = [];
    for (let i = 1; i <= 8; i++) {
        photos.push(`fotos/${i}.jpg`);
    }
    NUM_PHOTOS = photos.length;
    console.log(`Usando fallback: ${NUM_PHOTOS} fotos Inove`);
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
const starBtnRight = document.getElementById('starBtnRight');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const counter = document.getElementById('counter');

// ============================================
// INICIALIZAÇÃO DE POSIÇÕES
// ============================================
function generatePositions() {
    // Gera posições para Inove (baseado na quantidade real)
    photoPositions = photos.map((photo, idx) => {
        const angle = (idx / photos.length) * Math.PI * 2 + Math.random() * 0.5;
        const distance = 300 + Math.random() * 250;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        const rotation = -25 + Math.random() * 50;
        return { x, y, rotation };
    });

    // Gera posições para Estrela (baseado na quantidade real de Estrela)
    const numEstrela = window.estrelaPhotos ? window.estrelaPhotos.length : NUM_FOTOS;
    starPhotoPositions = photos.map((photo, idx) => {
        if (idx >= numEstrela) {
            // Se há mais fotos Inove que Estrela, preenche com posições vazias
            return { x: 0, y: 0, rotation: 0 };
        }
        const angle = (idx / numEstrela) * Math.PI * 2 + Math.random() * 0.5;
        const distance = 300 + Math.random() * 250;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        const rotation = -25 + Math.random() * 50;
        return { x, y, rotation };
    });
}

// ============================================
// BANCADA - GERAÇÃO INICIAL
// ============================================
function initScatteredPhotos() {
    counterSurface.innerHTML = '';
    const positions = isStarMode ? starPhotoPositions : photoPositions;
    
    // Define quantas fotos mostrar
    const numToShow = isStarMode ? NUM_ESTRELA : NUM_PHOTOS;
    
    photos.forEach((photo, idx) => {
        // Pula fotos que não existem no ambiente atual
        if (idx >= numToShow) {
            return;
        }
        
        const photoPath = isStarMode ? `fotos/e${idx + 1}.jpg` : photo;
        const polaroid = document.createElement('div');
        polaroid.className = 'polaroid scattered-polaroid';
        polaroid.innerHTML = `<img src="${photoPath}" alt="Foto ${idx + 1}" class="polaroid-img">`;
        polaroid.dataset.index = idx;
        
        const pos = positions[idx];
        polaroid.style.left = `calc(50% + ${pos.x}px)`;
        polaroid.style.top = `calc(50% + ${pos.y}px)`;
        polaroid.style.transform = `translate(-50%, -50%) rotate(${pos.rotation}deg)`;
        polaroid.style.zIndex = Math.floor(Math.random() * 10);

        polaroid.addEventListener('click', () => {
            if (galleryMode.classList.contains('active')) {
                currentIndex = idx;
                updateGalleryView();
                updateScatteredVisibility();
            } else {
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
// CONTROLE DE VISIBILIDADE
// ============================================
function updateScatteredVisibility() {
    const allScattered = document.querySelectorAll('.scattered-polaroid');
    allScattered.forEach(card => {
        const idx = parseInt(card.dataset.index);
        if (idx === currentIndex && currentIndex !== -1) {
            card.classList.add('hide-for-detail');
        } else {
            card.classList.remove('hide-for-detail');
        }
    });

    if (currentIndex === -1) {
        counter.textContent = `Selecione uma foto`;
        counterMode.classList.remove('detail-view');
    } else {
        const numFotos = isStarMode ? NUM_ESTRELA : NUM_PHOTOS;
        counter.textContent = `${currentIndex + 1} / ${numFotos}`;
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
    isStarMode = !isStarMode;
    if (isStarMode) {
        starBtn.classList.remove('active');
        starBtnRight.classList.add('active');
    } else {
        starBtn.classList.add('active');
        starBtnRight.classList.remove('active');
    }
    if (counterMode.classList.contains('active')) {
        initScatteredPhotos();
        updateScatteredVisibility();
    } else if (galleryMode.classList.contains('active')) {
        currentIndex = -1;
        updateGalleryView();
        updateScatteredVisibility();
    }
});

starBtnRight.addEventListener('click', () => {
    starBtn.click();
});

// ============================================
// GALERIA - VISUALIZAÇÃO
// ============================================
function updateGalleryView() {
    const existingCenter = document.querySelector('.center-polaroid');
    if (existingCenter) existingCenter.remove();

    galleryGrid.innerHTML = '';
    if (currentIndex === -1) currentIndex = 0;

    // Define quantas fotos tem no ambiente atual
    const numFotos = isStarMode ? NUM_ESTRELA : NUM_PHOTOS;
    
    // Se o índice atual é maior que o máximo, reseta
    if (currentIndex >= numFotos) {
        currentIndex = 0;
    }

    const prevIndex = (currentIndex - 1 + numFotos) % numFotos;
    const nextIndex = (currentIndex + 1) % numFotos;

    const createGalleryCard = (index, type) => {
        const div = document.createElement('div');
        div.className = `polaroid ${type}`;
        const photoPath = isStarMode ? `fotos/e${index + 1}.jpg` : photos[index];
        div.innerHTML = `<img src="${photoPath}" class="polaroid-img">`;
        div.addEventListener('click', () => {
            if(type === 'current') {
                counterBtn.click();
            } else {
                currentIndex = index;
                updateGalleryView();
                updateScatteredVisibility();
            }
        });
        return div;
    };

    galleryGrid.appendChild(createGalleryCard(prevIndex, ''));
    galleryGrid.appendChild(createGalleryCard(currentIndex, 'current'));
    galleryGrid.appendChild(createGalleryCard(nextIndex, ''));
}

// ============================================
// DETALHE - ABRIR
// ============================================
function openDetail(idx) {
    if (isAnimating) return;
    isAnimating = true;

    currentIndex = idx;
    const positions = isStarMode ? starPhotoPositions : photoPositions;
    const pos = positions[idx];
    const photoPath = isStarMode ? `fotos/e${idx + 1}.jpg` : photos[idx];

    updateScatteredVisibility();

    const centerCard = document.createElement('div');
    centerCard.className = 'polaroid center-polaroid';
    centerCard.innerHTML = `<img src="${photoPath}" alt="Foto central" class="polaroid-img">`;
    centerCard.dataset.index = idx;
    centerCard.addEventListener('click', closeDetail);

    centerCard.style.animation = 'none';
    centerCard.style.position = 'absolute';
    centerCard.style.left = '50%';
    centerCard.style.top = '50%';
    centerCard.style.zIndex = 100;
    centerCard.style.transition = 'none';
    centerCard.style.transform = `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px) rotate(${pos.rotation}deg) scale(0.5)`;

    counterSurface.appendChild(centerCard);
    centerCard.offsetHeight;

    centerCard.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
    centerCard.classList.add('visible');
    centerCard.style.transform = `translate(-50%, -50%) translate(0px, 0px) rotate(0deg) scale(1)`;

    setTimeout(() => {
        isAnimating = false;
    }, 650);
}

// ============================================
// DETALHE - FECHAR
// ============================================
function closeDetail() {
    if (isAnimating || currentIndex === -1) return;
    isAnimating = true;

    const centerCard = document.querySelector('.center-polaroid');
    const closingIndex = currentIndex;
    const positions = isStarMode ? starPhotoPositions : photoPositions;
    const pos = positions[closingIndex];

    if (centerCard) {
        centerCard.classList.remove('visible');
        centerCard.style.animation = 'none';
        centerCard.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
        centerCard.style.transform = `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px) rotate(${pos.rotation}deg) scale(0.5)`;
    }

    setTimeout(() => {
        if (centerCard) centerCard.remove();
        currentIndex = -1;
        updateScatteredVisibility();
        isAnimating = false;
    }, 600);
}

// ============================================
// TROCAR FOTO
// ============================================
function changePhoto(newIndex) {
    if (isAnimating || currentIndex === -1 || newIndex === currentIndex) return;
    isAnimating = true;
    
    const oldIndex = currentIndex;
    const centerCard = document.querySelector('.center-polaroid');
    const positions = isStarMode ? starPhotoPositions : photoPositions;
    const oldPos = positions[oldIndex];
    const newPos = positions[newIndex];
    const newPhotoPath = isStarMode ? `fotos/e${newIndex + 1}.jpg` : photos[newIndex];

    if (centerCard) {
        centerCard.classList.remove('visible');
        centerCard.style.animation = 'none';
        centerCard.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
        centerCard.style.zIndex = 40;
        centerCard.style.transform = `translate(-50%, -50%) translate(${oldPos.x}px, ${oldPos.y}px) rotate(${oldPos.rotation}deg) scale(0.5)`;
    }

    setTimeout(() => {
        if (centerCard) centerCard.remove();
        currentIndex = newIndex;
        updateScatteredVisibility();

        const newCenterCard = document.createElement('div');
        newCenterCard.className = 'polaroid center-polaroid';
        newCenterCard.innerHTML = `<img src="${newPhotoPath}" alt="Foto central" class="polaroid-img">`;
        newCenterCard.dataset.index = newIndex;
        newCenterCard.addEventListener('click', closeDetail);

        newCenterCard.style.animation = 'none';
        newCenterCard.style.position = 'absolute';
        newCenterCard.style.left = '50%';
        newCenterCard.style.top = '50%';
        newCenterCard.style.zIndex = 100;
        newCenterCard.style.transition = 'none';
        newCenterCard.style.transform = `translate(-50%, -50%) translate(${newPos.x}px, ${newPos.y}px) rotate(${newPos.rotation}deg) scale(0.5)`;

        counterSurface.appendChild(newCenterCard);
        newCenterCard.offsetHeight;

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
    const numFotos = isStarMode ? NUM_ESTRELA : NUM_PHOTOS;
    const newIndex = (currentIndex - 1 + numFotos) % numFotos;
    changePhoto(newIndex);
});

nextBtn.addEventListener('click', () => {
    if (currentIndex === -1) return;
    const numFotos = isStarMode ? NUM_ESTRELA : NUM_PHOTOS;
    const newIndex = (currentIndex + 1) % numFotos;
    changePhoto(newIndex);
});

document.addEventListener('keydown', (e) => {
    if (currentIndex !== -1) {
        const numFotos = isStarMode ? NUM_ESTRELA : NUM_PHOTOS;
        if (e.key === 'ArrowLeft') {
            const newIndex = (currentIndex - 1 + numFotos) % numFotos;
            changePhoto(newIndex);
        }
        if (e.key === 'ArrowRight') {
            const newIndex = (currentIndex + 1) % numFotos;
            changePhoto(newIndex);
        }
        if (e.key === 'Escape') {
            closeDetail();
        }
    }
});

counterSurface.addEventListener('click', (e) => {
    if (currentIndex !== -1 && e.target === counterSurface) {
        closeDetail();
    }
});

// ============================================
// INICIALIZAÇÃO
// ============================================
async function init() {
    // Tenta carregar fotos dinamicamente
    const loaded = await loadPhotos();
    
    // Se falhar, usa fallback
    if (!loaded) {
        loadPhotosManual();
    }
    
    // Inicia o sistema
    generatePositions();
    initScatteredPhotos();
    updateScatteredVisibility();
}

// Inicia quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
