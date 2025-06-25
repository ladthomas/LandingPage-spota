// Enhanced interactivity for Spota landing page

// Smooth scroll for navigation links
document.addEventListener('DOMContentLoaded', function() {
    console.log("Landing page Spota chargée avec succès ! 🎉");
    
    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('.nav-menu a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Add scroll-triggered animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animatedElements = document.querySelectorAll('.benefit-card, .testimonial-card, .faq-item');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });
    
    // CTA button click tracking
    const ctaButtons = document.querySelectorAll('.btn-primary, .btn-secondary');
    ctaButtons.forEach(button => {
        button.addEventListener('click', function() {
            console.log('CTA cliqué:', this.textContent);
            // Ici vous pourriez ajouter Google Analytics ou autre tracking
        });
    });
    
    // Add hover effects for testimonial cards
    const testimonialCards = document.querySelectorAll('.testimonial-card');
    testimonialCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // Header scroll effect
    let lastScrollTop = 0;
    const header = document.querySelector('header');
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // Scrolling down
            header.style.transform = 'translateY(-100%)';
        } else {
            // Scrolling up
            header.style.transform = 'translateY(0)';
        }
        
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    });
    
    header.style.transition = 'transform 0.3s ease-in-out';
});

// Spota Landing Page - Intégration API OpenData Paris
// API: https://opendata.paris.fr/explore/dataset/que-faire-a-paris-/api/

class SpotaApp {
    constructor() {
        this.apiUrl = 'https://opendata.paris.fr/api/records/1.0/search/';
        this.dataset = 'que-faire-a-paris-';
        this.events = [];
        this.filteredEvents = [];
        this.currentOffset = 0;
        this.rowsPerPage = 12;
        this.currentCategory = 'all';
        this.currentFilters = {
            price: 'all',
            date: 'all'
        };
        
        this.init();
    }
    
    init() {
        console.log("🎉 Spota App initialisée avec l'API OpenData Paris");
        this.setupEventListeners();
        this.loadEvents();
    }
    
    setupEventListeners() {
        // Navigation par catégories
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleCategoryChange(e.target);
            });
        });
        
        // Cartes de catégories
        document.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const category = e.currentTarget.dataset.category;
                this.filterByCategory(category);
            });
        });
        
        // Filtres
        document.getElementById('priceFilter').addEventListener('change', (e) => {
            this.currentFilters.price = e.target.value;
            this.applyFilters();
        });
        
        document.getElementById('dateFilter').addEventListener('change', (e) => {
            this.currentFilters.date = e.target.value;
            this.applyFilters();
        });
        
        // Recherche
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });
        
        // Bouton "Voir plus"
        document.getElementById('loadMore').addEventListener('click', () => {
            this.loadMoreEvents();
        });
    }
    
    async loadEvents() {
        try {
            this.showLoading(true);
            
            const params = new URLSearchParams({
                dataset: this.dataset,
                rows: 50,
                start: 0,
                facet: ['category', 'tags', 'price_type', 'access_type'],
                refine: 'city:Paris'
            });
            
            const response = await fetch(`${this.apiUrl}?${params}`);
            const data = await response.json();
            
            if (data.records) {
                this.events = data.records.map(record => this.transformEvent(record));
                this.filteredEvents = [...this.events];
                
                this.displayEvents();
                this.updateStats();
                console.log(`✅ ${this.events.length} événements chargés depuis l'API OpenData Paris`);
            }
            
        } catch (error) {
            console.error('❌ Erreur lors du chargement des événements:', error);
            this.showError();
        } finally {
            this.showLoading(false);
        }
    }
    
    transformEvent(record) {
        const fields = record.fields;
        
        return {
            id: record.recordid,
            title: fields.title || 'Événement sans titre',
            description: fields.lead_text || fields.description || 'Description non disponible',
            category: this.mapCategory(fields.category),
            tags: fields.tags || [],
            price: this.mapPrice(fields.price_type, fields.price_detail),
            date: {
                start: fields.date_start ? new Date(fields.date_start) : new Date(),
                end: fields.date_end ? new Date(fields.date_end) : null
            },
            location: {
                name: fields.address_name || 'Lieu non spécifié',
                address: fields.address_street || '',
                city: fields.address_city || 'Paris',
                zipcode: fields.address_zipcode || ''
            },
            image: fields.cover_url || this.getDefaultImage(fields.category),
            url: fields.url || '#',
            isFree: fields.price_type === 'gratuit' || fields.access_type === 'libre',
            coordinates: fields.lat_lon ? {
                lat: fields.lat_lon[0],
                lon: fields.lat_lon[1]
            } : null
        };
    }
    
    mapCategory(category) {
        const categoryMap = {
            'Concert': 'musique',
            'Spectacle': 'culture',
            'Exposition': 'culture',
            'Sport': 'sport',
            'Enfants': 'famille',
            'Visite': 'culture',
            'Atelier': 'culture',
            'Conférence': 'culture',
            'Festival': 'musique'
        };
        
        return categoryMap[category] || 'culture';
    }
    
    mapPrice(priceType, priceDetail) {
        if (priceType === 'gratuit') return 'Gratuit';
        if (priceType === 'payant' && priceDetail) return priceDetail;
        return 'Prix non précisé';
    }
    
    getDefaultImage(category) {
        const defaultImages = {
            'Concert': 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
            'Spectacle': 'https://images.unsplash.com/photo-1507924538820-ede94a04019d?w=400&h=300&fit=crop',
            'Exposition': 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop',
            'Sport': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
            'Enfants': 'https://images.unsplash.com/photo-1560582736-b4c5e8b91e97?w=400&h=300&fit=crop'
        };
        
        return defaultImages[category] || 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=400&h=300&fit=crop';
    }
    
    displayEvents() {
        const topEventsContainer = document.getElementById('topEvents');
        const allEventsContainer = document.getElementById('allEvents');
        
        // Top 10 événements
        const topEvents = this.filteredEvents.slice(0, 10);
        topEventsContainer.innerHTML = topEvents.map(event => this.createEventCard(event)).join('');
        
        // Tous les événements
        const displayEvents = this.filteredEvents.slice(0, this.currentOffset + this.rowsPerPage);
        allEventsContainer.innerHTML = displayEvents.map(event => this.createEventCard(event)).join('');
        
        // Bouton "Voir plus"
        const loadMoreBtn = document.getElementById('loadMore');
        if (displayEvents.length < this.filteredEvents.length) {
            loadMoreBtn.style.display = 'block';
        } else {
            loadMoreBtn.style.display = 'none';
        }
        
        // Ajouter les écouteurs d'événements aux cartes
        this.attachEventCardListeners();
    }
    
    createEventCard(event) {
        const formatDate = (date) => {
            return date.toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short'
            });
        };
        
        const truncateText = (text, maxLength = 100) => {
            return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
        };
        
        return `
            <div class="event-card" data-event-id="${event.id}" data-category="${event.category}">
                <div class="event-image">
                    <img src="${event.image}" alt="${event.title}" loading="lazy">
                    <div class="event-price ${event.isFree ? 'free' : ''}">${event.price}</div>
                </div>
                <div class="event-content">
                    <h3 class="event-title">${event.title}</h3>
                    <div class="event-info">
                        <span class="event-date">📅 ${formatDate(event.date.start)}</span>
                        <span class="event-location">📍 ${event.location.name}</span>
                    </div>
                    <p class="event-description">${truncateText(event.description)}</p>
                </div>
            </div>
        `;
    }
    
    attachEventCardListeners() {
        document.querySelectorAll('.event-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const eventId = e.currentTarget.dataset.eventId;
                this.showEventDetails(eventId);
            });
        });
    }
    
    showEventDetails(eventId) {
        const event = this.events.find(e => e.id === eventId);
        if (!event) return;
        
        // Créer une modale pour afficher les détails
        const modal = document.createElement('div');
        modal.className = 'event-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <button class="modal-close">&times;</button>
                <img src="${event.image}" alt="${event.title}" class="modal-image">
                <div class="modal-body">
                    <h2>${event.title}</h2>
                    <div class="modal-info">
                        <p><strong>📅 Date:</strong> ${event.date.start.toLocaleDateString('fr-FR')}</p>
                        <p><strong>📍 Lieu:</strong> ${event.location.name}, ${event.location.address}</p>
                        <p><strong>💰 Prix:</strong> ${event.price}</p>
                        <p><strong>🏷️ Catégorie:</strong> ${event.category}</p>
                    </div>
                    <p class="modal-description">${event.description}</p>
                    <div class="modal-actions">
                        <a href="${event.url}" target="_blank" class="btn-primary">Plus d'infos</a>
                        <button class="btn-secondary" onclick="this.closest('.event-modal').remove()">Fermer</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Fermer la modale
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    handleCategoryChange(button) {
        // Mise à jour des boutons de navigation
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');
        
        // Filtrer par catégorie
        this.currentCategory = button.dataset.category;
        this.applyFilters();
    }
    
    filterByCategory(category) {
        this.currentCategory = category;
        
        // Mettre à jour le bouton de navigation actif
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.category === category) {
                btn.classList.add('active');
            }
        });
        
        this.applyFilters();
    }
    
    applyFilters() {
        this.filteredEvents = this.events.filter(event => {
            // Filtre par catégorie
            if (this.currentCategory !== 'all' && event.category !== this.currentCategory) {
                return false;
            }
            
            // Filtre par prix
            if (this.currentFilters.price === 'gratuit' && !event.isFree) {
                return false;
            }
            if (this.currentFilters.price === 'payant' && event.isFree) {
                return false;
            }
            
            // Filtre par date
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const eventDate = new Date(event.date.start.getFullYear(), event.date.start.getMonth(), event.date.start.getDate());
            
            if (this.currentFilters.date === 'today' && eventDate.getTime() !== today.getTime()) {
                return false;
            }
            
            if (this.currentFilters.date === 'week') {
                const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                if (eventDate < today || eventDate > weekFromNow) {
                    return false;
                }
            }
            
            if (this.currentFilters.date === 'weekend') {
                const dayOfWeek = eventDate.getDay();
                if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = dimanche, 6 = samedi
                    return false;
                }
            }
            
            return true;
        });
        
        this.currentOffset = 0;
        this.displayEvents();
        this.updateStats();
    }
    
    handleSearch(query) {
        if (!query.trim()) {
            this.applyFilters();
            return;
        }
        
        const searchTerm = query.toLowerCase();
        this.filteredEvents = this.events.filter(event => {
            return event.title.toLowerCase().includes(searchTerm) ||
                   event.description.toLowerCase().includes(searchTerm) ||
                   event.location.name.toLowerCase().includes(searchTerm) ||
                   event.tags.some(tag => tag.toLowerCase().includes(searchTerm));
        });
        
        this.currentOffset = 0;
        this.displayEvents();
        this.updateStats();
    }
    
    loadMoreEvents() {
        this.currentOffset += this.rowsPerPage;
        this.displayEvents();
    }
    
    updateStats() {
        const eventsCountElement = document.getElementById('eventsCount');
        if (eventsCountElement) {
            this.animateNumber(eventsCountElement, this.filteredEvents.length);
        }
    }
    
    animateNumber(element, target) {
        const duration = 1000;
        const start = parseInt(element.textContent) || 0;
        const increment = (target - start) / (duration / 16);
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = target;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current);
            }
        }, 16);
    }
    
    showLoading(show) {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = show ? 'block' : 'none';
        }
    }
    
    showError() {
        const allEventsContainer = document.getElementById('allEvents');
        allEventsContainer.innerHTML = `
            <div class="error-message">
                <h3>Oops ! Impossible de charger les événements</h3>
                <p>Veuillez réessayer plus tard ou vérifier votre connexion internet.</p>
                <button class="btn-primary" onclick="location.reload()">Réessayer</button>
            </div>
        `;
    }
}

// Styles pour la modale (ajoutés dynamiquement)
const modalStyles = `
    <style>
        .event-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        }
        
        .modal-content {
            background: white;
            border-radius: 12px;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            position: relative;
        }
        
        .modal-close {
            position: absolute;
            top: 15px;
            right: 20px;
            background: none;
            border: none;
            font-size: 30px;
            cursor: pointer;
            z-index: 1;
            color: white;
            text-shadow: 0 0 5px rgba(0,0,0,0.5);
        }
        
        .modal-image {
            width: 100%;
            height: 250px;
            object-fit: cover;
            border-radius: 12px 12px 0 0;
        }
        
        .modal-body {
            padding: 20px;
        }
        
        .modal-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
        }
        
        .modal-info p {
            margin: 5px 0;
        }
        
        .modal-description {
            line-height: 1.6;
            margin: 15px 0;
        }
        
        .modal-actions {
            display: flex;
            gap: 10px;
            margin-top: 20px;
        }
        
        .btn-secondary {
            background: none;
            border: 2px solid #ff385c;
            color: #ff385c;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .btn-secondary:hover {
            background: #ff385c;
            color: white;
        }
        
        .error-message {
            text-align: center;
            padding: 60px 20px;
            color: #666;
        }
        
        .error-message h3 {
            margin-bottom: 15px;
            color: #333;
        }
    </style>
`;

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎉 Spota is ready!');
    
    // Animation des éléments au scroll
    initScrollAnimations();
    
    // Navigation fluide
    initSmoothScrolling();
    
    // Header intelligent qui se cache
    initSmartHeader();
    
    // Gestion des clics sur les CTA
    trackCTAClicks();
    
    // Animation des compteurs dans les témoignages
    initCounterAnimations();
});

// Animation des éléments au scroll
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observer les cartes et sections
    document.querySelectorAll('.benefit-card, .testimonial-card, .faq-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Navigation fluide vers les sections
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Header qui se cache au scroll vers le bas
function initSmartHeader() {
    let lastScrollTop = 0;
    const header = document.querySelector('header');
    
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // Scroll vers le bas - cacher le header
            header.style.transform = 'translateY(-100%)';
        } else {
            // Scroll vers le haut - montrer le header
            header.style.transform = 'translateY(0)';
        }
        
        lastScrollTop = scrollTop;
    });
}

// Tracking des clics sur les boutons CTA
function trackCTAClicks() {
    document.querySelectorAll('.btn-primary, .btn-secondary').forEach(button => {
        button.addEventListener('click', function(e) {
            // Ici on pourrait ajouter un tracking analytics
            console.log('CTA clicked:', this.textContent);
            
            // Animation de feedback
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });
}

// Animation des compteurs (simulé pour l'instant)
function initCounterAnimations() {
    const stats = [
        { element: '.hero-subtitle', text: 'Plus de 50 000 utilisateurs satisfaits' }
    ];
    
    // Ici on pourrait ajouter des animations de compteurs
    // pour des statistiques réelles
}

// Gestion des témoignages rotatifs (bonus)
function initTestimonialRotation() {
    const testimonials = document.querySelectorAll('.testimonial-card');
    let currentIndex = 0;
    
    setInterval(() => {
        testimonials[currentIndex].style.opacity = '0.7';
        currentIndex = (currentIndex + 1) % testimonials.length;
        setTimeout(() => {
            testimonials[currentIndex].style.opacity = '1';
        }, 300);
    }, 5000);
}

// Easter egg - Konami Code
let konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
let konamiIndex = 0;

document.addEventListener('keydown', function(e) {
    if (e.code === konamiCode[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konamiCode.length) {
            // Easter egg activé !
            document.body.style.filter = 'hue-rotate(180deg)';
            setTimeout(() => {
                document.body.style.filter = '';
            }, 3000);
            konamiIndex = 0;
        }
    } else {
        konamiIndex = 0;
    }
});
