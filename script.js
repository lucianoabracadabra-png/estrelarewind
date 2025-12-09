// ============================================
// VARIÁVEIS GLOBAIS
// ============================================
let currentIndex = -1;
let photos = []; // Array de URLs da Inove
let estrelaPhotos = []; // Array de URLs da Estrela
let photoPositions = []; // Armazena posições {x, y, rotation}
let starPhotoPositions = [];
let isAnimating = false;
let isStarMode = false;

// Configurações de limite para carregamento
const MAX_SCAN_INOVE = 602; 
const MAX_SCAN_ESTRELA = 20; 
const MAX_BANCADA = 100; 

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
// SISTEMA DE CARREGAMENTO PROGRESSIVO
// ============================================

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function generateRandomPosition() {
    let x, y, distance;
    const centerX = 0;
    const centerY = 0;
    const minDistanceFromCenter = 250;
    
    do {
        x = (Math.random() - 0.5) * 1300;
        y = (Math.random() - 0.5) * 700;
        distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    } while (distance < minDistanceFromCenter);
    
    return { x, y, rotation: -25 + Math.random() * 50 };
}

function checkImage(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ success: true, url: url });
        img.onerror = () => resolve({ success: false, url: url });
        img.src = url;
    });
}

async function startProgressiveLoading() {
    let inoveIndices = Array.from({ length: MAX_SCAN_INOVE }, (_, i) => i + 1);
    inoveIndices = shuffleArray(inoveIndices);

    let estrelaIndices = Array.from({ length: MAX_SCAN_ESTRELA }, (_, i) => i + 1);
    estrelaIndices = shuffleArray(estrelaIndices);

    const processQueue = async (queue, type) => {
        const batchSize = 10;
        while (queue.length > 0) {
            const batch = queue.splice(0, batchSize);
            const promises = batch.map(idx => {
                const url = type === 'inove' ? `fotos/${idx}.jpg` : `fotos/e${idx}.jpg`;
                return checkImage(url).then(result => {
                    if (result.success) {
                        registerPhoto(result.url, type);
                    }
                });
            });
            await Promise.all(promises);
            await new Promise(r => setTimeout(r, 50));
        }
    };

    processQueue(inoveIndices, 'inove');
    processQueue(estrelaIndices, 'estrela');
}

function registerPhoto(url, type) {
    if (type === 'inove') {
        photos.push(url);
        if (!isStarMode) addPolaroidToBench(url, photos.length - 1, 'inove');
    } else {
        estrelaPhotos.push(url);
        if (isStarMode) addPolaroidToBench(url, estrelaPhotos.length - 1, 'estrela');
    }
    updateCounterText();
}

function addPolaroidToBench(url, arrayIndex, type) {
    // Se for Inove e já tivermos muitas fotos, para de adicionar ao DOM (mas continua carregando dados)
    if (type === 'inove' && document.querySelectorAll('.scattered-polaroid:not(.star-item)').length >= MAX_BANCADA) return;

    // Gera e salva posição
    const pos = generateRandomPosition();
    if (type === 'inove') photoPositions[arrayIndex] = pos;
    else starPhotoPositions[arrayIndex] = pos;

    const optimizedPath = getOptimizedPhotoPath(url, 'low');
    const polaroid = document.createElement('div');
    polaroid.className = `polaroid scattered-polaroid ${type === 'estrela' ? 'star-item' : ''}`;
    polaroid.innerHTML = `<img src="${optimizedPath}" alt="Foto" class="polaroid-img">`;
    polaroid.dataset.index = arrayIndex;

    polaroid.style.left = `calc(50% + ${pos.x}px)`;
    polaroid.style.top = `calc(50% + ${pos.y}px)`;
    
    // Animação de entrada suave (Pop-in)
    polaroid.style.transform = `translate(-50%, -50%) rotate(${pos.rotation}deg) scale(0)`;
    polaroid.style.zIndex = Math.floor(Math.random() * 10);
    
    requestAnimationFrame(() => {
        polaroid.style.transition = 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        polaroid.style.transform = `translate(-50%, -50%) rotate(${pos.rotation}deg) scale(1)`;
    });

    polaroid.addEventListener('click', () => {
        // Encontra o índice real atual (pois o carregamento é assíncrono)
        const currentList = isStarMode ? estrelaPhotos : photos;
        const clickedIndex = currentList.indexOf(url);
        
        if (galleryMode.classList.contains('active')) {
            currentIndex = clickedIndex;
            updateGalleryView();
            updateScatteredVisibility();
        } else {
            if (currentIndex === -1) {
                openDetail(clickedIndex);
            } else if (currentIndex !== clickedIndex) {
                changePhoto(clickedIndex);
            }
        }
    });

    counterSurface.appendChild(polaroid);
}

function updateCounterText() {
    if (currentIndex === -1) {
        counter.textContent = `Selecione uma foto`;
    } else {
        const total = isStarMode ? estrelaPhotos.length : photos.length;
        counter.textContent = `${currentIndex + 1} / ${total}`;
    }
}

function getOptimizedPhotoPath(originalPath, quality = 'low') {
    if (originalPath.includes('/e')) return originalPath;
    if (quality === 'low') return originalPath.replace(/\.jpg$/i, '-low.jpg');
    return originalPath;
}

// ============================================
// FUNÇÃO AUXILIAR - POSIÇÃO
// ============================================
function getPhotoPosition(idx, positions) {
    if (positions[idx]) {
        return positions[idx];
    }
    // Se a posição não existe (ex: clicou na galeria antes de carregar na bancada), gera uma temporária
    // para a animação não quebrar (vir do centro ou ir para o centro)
    return { x: 0, y: 0, rotation: 0 };
}

// ============================================
// DETALHE E ANIMAÇÃO (RESTAURADOS FIELMENTE)
// ============================================

function openDetail(idx) {
    if (isAnimating) return;
    isAnimating = true;

    currentIndex = idx;
    const positions = isStarMode ? starPhotoPositions : photoPositions;
    const pos = getPhotoPosition(idx, positions);
    const photoPath = isStarMode ? estrelaPhotos[idx] : photos[idx];

    updateScatteredVisibility();

    const centerCard = document.createElement('div');
    centerCard.className = 'polaroid center-polaroid';
    centerCard.innerHTML = `<img src="${photoPath}" alt="Foto central" class="polaroid-img">`;
    centerCard.dataset.index = idx;
    centerCard.addEventListener('click', closeDetail);

    // CONFIGURAÇÃO INICIAL (EXATAMENTE COMO O ORIGINAL)
    centerCard.style.animation = 'none';
    centerCard.style.position = 'absolute';
    centerCard.style.left = '50%';
    centerCard.style.top = '50%';
    centerCard.style.zIndex = 100;
    centerCard.style.transition = 'none';
    // O segredo está aqui: translate(-50%, -50%) + translate(pos)
    centerCard.style.transform = `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px) rotate(${pos.rotation}deg) scale(0.5)`;

    counterSurface.appendChild(centerCard);
    centerCard.offsetHeight; // Força reflow

    // ANIMAÇÃO PARA O CENTRO
    centerCard.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
    centerCard.classList.add('visible');
    centerCard.style.transform = `translate(-50%, -50%) translate(0px, 0px) rotate(0deg) scale(1)`;

    setTimeout(() => {
        isAnimating = false;
    }, 650);
}

function closeDetail() {
    if (isAnimating || currentIndex === -1) return;
    isAnimating = true;

    const centerCard = document.querySelector('.center-polaroid');
    const closingIndex = currentIndex;
    const positions = isStarMode ? starPhotoPositions : photoPositions;
    const pos = getPhotoPosition(closingIndex, positions);

    if (centerCard) {
        centerCard.classList.remove('visible');
        centerCard.style.animation = 'none';
        centerCard.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
        // VOLTA PARA A POSIÇÃO ORIGINAL
        centerCard.style.transform = `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px) rotate(${pos.rotation}deg) scale(0.5)`;
    }

    setTimeout(() => {
        if (centerCard) centerCard.remove();
        currentIndex = -1;
        updateScatteredVisibility();
        isAnimating = false;
    }, 600);
}

function changePhoto(newIndex) {
    if (isAnimating || currentIndex === -1 || newIndex === currentIndex) return;
    isAnimating = true;
    
    const oldIndex = currentIndex;
    const centerCard = document.querySelector('.center-polaroid');
    const positions = isStarMode ? starPhotoPositions : photoPositions;
    const oldPos = getPhotoPosition(oldIndex, positions);
    const newPos = getPhotoPosition(newIndex, positions);
    const newPhotoPath = isStarMode ? estrelaPhotos[newIndex] : photos[newIndex];

    // ANIMA O CARTÃO ANTIGO SAINDO
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

        // CONFIGURA O NOVO CARTÃO NA POSIÇÃO DE ORIGEM
        newCenterCard.style.animation = 'none';
        newCenterCard.style.position = 'absolute';
        newCenterCard.style.left = '50%';
        newCenterCard.style.top = '50%';
        newCenterCard.style.zIndex = 100;
        newCenterCard.style.transition = 'none';
        newCenterCard.style.transform = `translate(-50%, -50%) translate(${newPos.x}px, ${newPos.y}px) rotate(${newPos.rotation}deg) scale(0.5)`;

        counterSurface.appendChild(newCenterCard);
        newCenterCard.offsetHeight;

        // ANIMA O NOVO CARTÃO PARA O CENTRO
        newCenterCard.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
        newCenterCard.classList.add('visible');
        newCenterCard.style.transform = `translate(-50%, -50%) translate(0px, 0px) rotate(0deg) scale(1)`;

        setTimeout(() => {
            isAnimating = false;
        }, 650);
    }, 150);
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
    updateCounterText();
    
    if (currentIndex !== -1) {
        counterMode.classList.add('detail-view');
    } else {
        counterMode.classList.remove('detail-view');
    }
}

// ============================================
// REFRESH DA BANCADA (AO TROCAR DE MODO)
// ============================================
function refreshScatteredPhotos() {
    counterSurface.innerHTML = '';
    const targetPhotos = isStarMode ? estrelaPhotos : photos;
    const limit = isStarMode ? targetPhotos.length : Math.min(targetPhotos.length, MAX_BANCADA);

    targetPhotos.forEach((url, idx) => {
        if (idx >= limit) return;
        
        let pos;
        if (isStarMode) {
            if (!starPhotoPositions[idx]) starPhotoPositions[idx] = generateRandomPosition();
            pos = starPhotoPositions[idx];
        } else {
            if (!photoPositions[idx]) photoPositions[idx] = generateRandomPosition();
            pos = photoPositions[idx];
        }

        const optimizedPath = getOptimizedPhotoPath(url, 'low');
        const polaroid = document.createElement('div');
        polaroid.className = 'polaroid scattered-polaroid';
        polaroid.innerHTML = `<img src="${optimizedPath}" alt="Foto" class="polaroid-img">`;
        polaroid.dataset.index = idx;
        
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
    updateScatteredVisibility();
}

// ============================================
// BOTÕES E INTERFACE
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
    
    // Na galeria, podemos querer ordenar visualmente
    if (!isStarMode) {
        photos.sort((a, b) => {
            const numA = parseInt(a.match(/\d+/)[0]);
            const numB = parseInt(b.match(/\d+/)[0]);
            return numA - numB;
        });
    }
    updateGalleryView();
});

starBtn.addEventListener('click', handleModeToggle);
starBtnRight.addEventListener('click', handleModeToggle);

function handleModeToggle() {
    isStarMode = !isStarMode;
    if (isStarMode) {
        starBtn.classList.remove('active');
        starBtnRight.classList.add('active');
    } else {
        starBtn.classList.add('active');
        starBtnRight.classList.remove('active');
    }
    currentIndex = -1;
    if (counterMode.classList.contains('active')) {
        refreshScatteredPhotos();
    } else {
        updateGalleryView();
    }
}

// ============================================
// GALERIA
// ============================================
function updateGalleryView() {
    galleryGrid.innerHTML = '';
    galleryGrid.className = 'gallery-grid'; 
    const currentList = isStarMode ? estrelaPhotos : photos;
    
    currentList.forEach((url, i) => {
        const thumbPath = getOptimizedPhotoPath(url, 'low');
        const match = url.match(/(\d+)\.jpg/);
        const displayNum = match ? match[1] : (i + 1);

        const link = document.createElement('a');
        link.className = 'gallery-item-link';
        link.href = url;
        link.target = '_blank';
        link.innerHTML = `
            <img src="${thumbPath}" class="gallery-catalog-img" loading="lazy" alt="Foto">
            <span class="gallery-number">#${displayNum}</span>
        `;
        galleryGrid.appendChild(link);
    });
}

// ============================================
// NAVEGAÇÃO E TECLADO
// ============================================
prevBtn.addEventListener('click', () => {
    if (currentIndex === -1) return;
    const total = isStarMode ? estrelaPhotos.length : photos.length;
    if (total === 0) return;
    const newIndex = (currentIndex - 1 + total) % total;
    changePhoto(newIndex);
});

nextBtn.addEventListener('click', () => {
    if (currentIndex === -1) return;
    const total = isStarMode ? estrelaPhotos.length : photos.length;
    if (total === 0) return;
    const newIndex = (currentIndex + 1) % total;
    changePhoto(newIndex);
});

document.addEventListener('keydown', (e) => {
    if (currentIndex !== -1) {
        const total = isStarMode ? estrelaPhotos.length : photos.length;
        if (total === 0) return;
        if (e.key === 'ArrowLeft') {
            const newIndex = (currentIndex - 1 + total) % total;
            changePhoto(newIndex);
        }
        if (e.key === 'ArrowRight') {
            const newIndex = (currentIndex + 1) % total;
            changePhoto(newIndex);
        }
        if (e.key === 'Escape') closeDetail();
    }
});

counterSurface.addEventListener('click', (e) => {
    if (currentIndex !== -1 && e.target === counterSurface) closeDetail();
});

galleryMode.addEventListener('click', (e) => {
    if (!e.target.closest('.gallery-item-link')) counterBtn.click();
});

// ============================================
// INICIALIZAÇÃO
// ============================================
function init() {
    startProgressiveLoading();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();

}
