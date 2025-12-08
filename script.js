// ============================================
// VARIÁVEIS GLOBAIS
// ============================================
let currentIndex = -1;
let photos = [];
let estrelaPhotos = [];
let photoPositions = [];
let starPhotoPositions = [];
let selectedBancadaIndices = []; // Indices das 100 fotos selecionadas para a bancada
let isAnimating = false;
let isStarMode = false;
let NUM_PHOTOS = 0;
let NUM_ESTRELA = 0;
let isGalleryDetailMode = false;



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
        for (let i = 1; i <= 999; i++) {
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
    // Função auxiliar para gerar posição aleatória evitando o centro
    const getRandomPosition = () => {
        let x, y, distance;
        const centerX = 0;
        const centerY = 0;
        const minDistanceFromCenter = 250; // Distância mínima do centro
        const maxDistance = 450; // Máxima distância do centro
        
        // Gera posição até estar fora da zona do centro
        do {
            x = (Math.random() - 0.5) * 1300; // Largura +10% em cada lado (900 * 1.1)
            y = (Math.random() - 0.5) * 700; // Altura +10% em cada lado (900 * 1.1)
            distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        } while (distance < minDistanceFromCenter);
        
        return { x, y };
    };

    // Seleciona aleatoriamente 100 fotos do total para a bancada Inove
    const maxPhotosToShow = 100;
    selectedBancadaIndices = [];
    if (photos.length > maxPhotosToShow) {
        // Se tem mais de 100 fotos, seleciona 100 aleatoriamente
        const allIndices = Array.from({ length: photos.length }, (_, i) => i);
        for (let i = allIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allIndices[i], allIndices[j]] = [allIndices[j], allIndices[i]];
        }
        selectedBancadaIndices.push(...allIndices.slice(0, maxPhotosToShow));
    } else {
        // Se tem 100 ou menos, usa todas
        selectedBancadaIndices.push(...Array.from({ length: photos.length }, (_, i) => i));
    }

    // Gera posições para Inove (apenas as 100 selecionadas aleatoriamente)
    photoPositions = new Array(photos.length);
    selectedBancadaIndices.forEach((originalIdx) => {
        const { x, y } = getRandomPosition();
        const rotation = -25 + Math.random() * 50;
        photoPositions[originalIdx] = { x, y, rotation };
    });

    // Gera posições para Estrela (baseado na quantidade real de Estrela)
    const numEstrela = window.estrelaPhotos ? window.estrelaPhotos.length : NUM_FOTOS;
    starPhotoPositions = photos.map((photo, idx) => {
        if (idx >= numEstrela) {
            // Se há mais fotos Inove que Estrela, preenche com posições vazias
            return { x: 0, y: 0, rotation: 0 };
        }
        const { x, y } = getRandomPosition();
        const rotation = -25 + Math.random() * 50;
        return { x, y, rotation };
    });
}

// ============================================
// FUNÇÃO AUXILIAR - GERAR VERSÃO OTIMIZADA
// ============================================
// ============================================
// FUNÇÃO AUXILIAR - GERAR VERSÃO OTIMIZADA
// ============================================
function getOptimizedPhotoPath(originalPath, quality = 'low') {
    // VERIFICAÇÃO: Se for foto da Estrela (contém '/e'), retorna a original sempre.
    // O padrão de nome é "fotos/e1.jpg", então verificamos se tem "/e"
    if (originalPath.includes('/e')) {
        return originalPath;
    }

    // Na bancada (Inove), usa versão com menor qualidade
    // Formato: fotos/1.jpg -> fotos/1-low.jpg (ou pode ser 1-thumb.jpg)
    if (quality === 'low') {
        return originalPath.replace(/\.jpg$/i, '-low.jpg');
    }
    return originalPath;
}

// ============================================
// BANCADA - GERAÇÃO INICIAL
// ============================================
function initScatteredPhotos() {
    counterSurface.innerHTML = '';
    const positions = isStarMode ? starPhotoPositions : photoPositions;
    
    // Para Inove, mostra apenas as 100 selecionadas aleatoriamente
    // Para Estrela, mostra todas
    const indicesToShow = isStarMode ? Array.from({ length: NUM_ESTRELA }, (_, i) => i) : selectedBancadaIndices;
    
    photos.forEach((photo, idx) => {
        // Verifica se este índice deve ser mostrado na bancada
        if (!indicesToShow.includes(idx)) {
            return;
        }
        
        const photoPath = isStarMode ? `fotos/e${idx + 1}.jpg` : photo;
        const optimizedPath = getOptimizedPhotoPath(photoPath, 'low'); // Usa versão otimizada (30% qualidade)
        const polaroid = document.createElement('div');
        polaroid.className = 'polaroid scattered-polaroid';
        polaroid.innerHTML = `<img src="${optimizedPath}" alt="Foto ${idx + 1}" class="polaroid-img">`;
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
// FUNÇÃO AUXILIAR - OBTER POSIÇÃO (BANCADA OU CENTRO)
// ============================================
function getPhotoPosition(idx, positions) {
    // Se a posição existe (foto está na bancada), retorna
    if (positions[idx]) {
        return positions[idx];
    }
    // Se não existe, retorna posição do centro (0, 0)
    return { x: 0, y: 0, rotation: 0 };
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
    
    // RESETAR O MODO: Sempre começa na grade
    isGalleryDetailMode = false; 
    
    updateGalleryView();
    // updateScatteredVisibility(); // Não precisa disso na galeria pura
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
// GALERIA - VISUALIZAÇÃO (4 POR LINHA / LINK EXTERNO)
// ============================================
function updateGalleryView() {
    galleryGrid.innerHTML = '';
    
    // Remove qualquer classe antiga e garante a classe de grid
    galleryGrid.className = 'gallery-grid'; 

    const numFotos = isStarMode ? NUM_ESTRELA : NUM_PHOTOS;
    
    for (let i = 0; i < numFotos; i++) {
        // Caminho da foto original (para o link)
        const originalPath = isStarMode ? `fotos/e${i + 1}.jpg` : photos[i];
        
        // Caminho da miniatura (para exibir na tela sem travar)
        const thumbPath = getOptimizedPhotoPath(originalPath, 'low');
        
        // Cria o link
        const link = document.createElement('a');
        link.className = 'gallery-item-link';
        link.href = originalPath;  // Abre a original
        link.target = '_blank';    // Nova aba
        
        // Monta o HTML: Imagem (sem height fixo) + Número
        link.innerHTML = `
            <img src="${thumbPath}" class="gallery-catalog-img" loading="lazy" alt="Foto ${i + 1}">
            <span class="gallery-number">#${i + 1}</span>
        `;
        
        galleryGrid.appendChild(link);
    }
}

// ============================================
// DETALHE - ABRIR
// ============================================
function openDetail(idx) {
    if (isAnimating) return;
    isAnimating = true;

    currentIndex = idx;
    const positions = isStarMode ? starPhotoPositions : photoPositions;
    const pos = getPhotoPosition(idx, positions);
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
    const pos = getPhotoPosition(closingIndex, positions);

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
    const oldPos = getPhotoPosition(oldIndex, positions);
    const newPos = getPhotoPosition(newIndex, positions);
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
// FECHAR GALERIA AO CLICAR FORA
// ============================================
galleryMode.addEventListener('click', (e) => {
    // Verifica se o clique NÃO foi em um link ou imagem da galeria
    if (!e.target.closest('.gallery-item-link')) {
        // Simula um clique no botão "Bancada" para voltar
        counterBtn.click();
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
