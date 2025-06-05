// script.js

const users = JSON.parse(localStorage.getItem("users")) || [
  {
    login: "client1",
    password: "1234",
    email: "client1@saveeat.com",
    type: "client",
    cart: [],
    fridge: [],
    savings: { totalNoDiscount: 0, totalSavings: 0, totalWeightSaved: 0 },
    favorites: [],
    history: []
  },
  {
    login: "admin",
    password: "1234",
    email: "admin@saveeat.com",
    type: "admin",
  },
  {
    login: "entreprise1",
    password: "1234",
    email: "contact@entreprise1.com",
    type: "entreprise",
  }
];

let produits = JSON.parse(localStorage.getItem("produits")) || [
  { id: 1, nom: "Pommes", prix: 3, reduction: 30, categorie: "Fruits", poids: { valeur: 0.5, unité: "kg" } },
  { id: 2, nom: "Poulet rôti", prix: 9.5, reduction: 40, categorie: "Viande", poids: { valeur: 1.2, unité: "kg" } },
  { id: 3, nom: "Lait", prix: 1.3, reduction: 20, categorie: "Laitier", poids: { valeur: 1, unité: "L" } },
  { id: 4, nom: "Riz", prix: 2, reduction: 25, categorie: "Sec", poids: { valeur: 0.75, unité: "kg" } }
];

let recettes = JSON.parse(localStorage.getItem("recettes")) || [
  {
    id: 'salade-composee',
    titre: 'Salade composée',
    ingredients: ['pommes', 'lait'],
    quantites: ['2 pommes', '1 verre de lait'],
    temps: '10 min',
    etapes: ['Couper les pommes.', 'Ajouter le lait.', 'Mélanger.']
  }
];

let econChartDonut = null;
let econChartMonthly = null;
let currentEditProductId = null;
let currentEditRecipeId = null;
let selectedCategory = "Toutes";
let currentSortName = "default";
let currentSortPrice = "default";

function logout() {
  localStorage.removeItem("currentUser");
  showToast("Déconnecté !");
  
  if (window.location.pathname.includes("compte.html") || 
      window.location.pathname.includes("profile.html")) {
    setTimeout(() => {
      window.location.href = "compte.html";
    }, 1000);
  } else {
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1000);
  }
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

function initAuth() {
  const form = document.getElementById("loginForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;
      
      const user = users.find(u => u.login === username && u.password === password);
      
      if (user) {
        localStorage.setItem("currentUser", JSON.stringify(user));
        showToast(`Bienvenue ${username} !`);
        
        setTimeout(() => {
          if (user.type === "admin") {
            window.location.href = "admin-accueil.html";
          } else if (user.type === "entreprise") {
            window.location.href = "entreprise-accueil.html";
          } else {
            window.location.href = "index.html";
          }
        }, 1000);
      } else {
        showToast("Identifiant ou mot de passe incorrect");
      }
    });
  }
  
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (currentUser) {
      logoutBtn.style.display = "block";
      logoutBtn.addEventListener("click", logout);
    } else {
      logoutBtn.style.display = "none";
    }
  }
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem("currentUser")) || null;
}

function getCurrentUserData() {
  const currentUser = getCurrentUser();
  if (!currentUser) return null;
  return users.find(u => u.login === currentUser.login) || null;
}

function saveUserData(user) {
  const index = users.findIndex(u => u.login === user.login);
  if (index !== -1) {
    users[index] = user;
    localStorage.setItem("users", JSON.stringify(users));
    localStorage.setItem("currentUser", JSON.stringify(user));
  }
}

function parseWeightInput(input) {
  if (!input) return { valeur: 0.5, unité: "kg" };
  
  const match = input.match(/([\d.]+)\s*(\D+)/);
  if (match) {
    const valeur = parseFloat(match[1]);
    const unité = match[2].trim().toLowerCase();
    
    return { valeur, unité };
  }
  
  return { valeur: parseFloat(input) || 0.5, unité: "kg" };
}

function formatWeight(poids) {
  if (!poids || typeof poids !== 'object') {
    return "0.5kg";
  }
  return `${poids.valeur}${poids.unité}`;
}

function convertToKg(poids) {
  if (!poids || typeof poids !== 'object') {
    return 0.5;
  }
  const value = poids.valeur;
  const unit = poids.unité.toLowerCase();
  switch (unit) {
    case 'kg': return value;
    case 'g': return value / 1000;
    case 'l': return value;
    case 'ml': return value / 1000;
    default: return value;
  }
}

function initAdmin() {
  const form = document.getElementById("adminForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const nom = document.getElementById("adminNom").value;
      const prix = parseFloat(document.getElementById("adminPrix").value);
      const cat = document.getElementById("adminCategorie").value;
      const normalizedCat = cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
      const reduc = parseInt(document.getElementById("adminReduction").value);
      const poidsInput = document.getElementById("adminPoids").value;
      
      const poids = parseWeightInput(poidsInput);
      
      if (currentEditProductId) {
        const index = produits.findIndex(p => p.id === currentEditProductId);
        if (index !== -1) {
          produits[index] = { 
            ...produits[index], 
            nom, 
            prix, 
            categorie: normalizedCat, 
            reduction: reduc, 
            poids 
          };
        }
        currentEditProductId = null;
      } else {
        const newId = Math.max(...produits.map(p => p.id), 0) + 1;
        produits.push({ 
          id: newId,
          nom, 
          prix, 
          categorie: normalizedCat, 
          reduction: reduc, 
          poids 
        });
      }
      
      localStorage.setItem("produits", JSON.stringify(produits));
      form.reset();
      showToast(currentEditProductId ? "Produit modifié !" : "Produit ajouté !");
      afficherProduitsAdmin();
    });
  }
  
  const recetteForm = document.getElementById("adminRecetteForm");
  if (recetteForm) {
    recetteForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const titre = document.getElementById("recetteTitre").value;
      const ingredients = document.getElementById("recetteIngredients").value.split(",").map(i => i.trim());
      const quantites = document.getElementById("recetteQuantites").value.split(",").map(q => q.trim());
      const temps = document.getElementById("recetteTemps").value;
      const etapes = document.getElementById("recetteEtapes").value.split(";").map(e => e.trim());
      
      const id = titre.toLowerCase().replace(/\s+/g, '-');
      
      if (currentEditRecipeId) {
        const index = recettes.findIndex(r => r.id === currentEditRecipeId);
        if (index !== -1) {
          recettes[index] = {
            id,
            titre,
            ingredients,
            quantites,
            temps,
            etapes
          };
        }
        currentEditRecipeId = null;
      } else {
        recettes.push({
          id,
          titre,
          ingredients,
          quantites,
          temps,
          etapes
        });
      }
      
      localStorage.setItem("recettes", JSON.stringify(recettes));
      recetteForm.reset();
      showToast(currentEditRecipeId ? "Recette modifiée !" : "Recette ajoutée !");
      afficherRecettesAdmin();
    });
  }
  
  afficherProduitsAdmin();
  afficherRecettesAdmin();
}

function afficherProduitsAdmin() {
  const div = document.getElementById("listeProduitsAdmin");
  if (!div) return;
  
  div.innerHTML = produits.map(p => `
    <div class="produit-card">
      <div>
        <strong>${formatWeight(p.poids)} ${p.nom}</strong>
        <small>${p.categorie}</small>
        <span>Prix: ${p.prix.toFixed(2)}€ (-${p.reduction}%)</span>
      </div>
      <div class="product-actions">
        <button onclick="supprimerProduit(${p.id})" class="btn-secondary">Supprimer</button>
        <button onclick="modifierProduit(${p.id})" class="btn-secondary">Modifier</button>
      </div>
    </div>
  `).join("");
}

function afficherRecettesAdmin() {
  const div = document.getElementById("listeRecettesAdmin");
  if (!div) return;
  
  div.innerHTML = recettes.map(r => `
    <div class="recette-card">
      <h3>${r.titre}</h3>
      <div class="recipe-actions">
        <div>
          <button onclick="supprimerRecette('${r.id}')" class="btn-secondary">Supprimer</button>
          <button onclick="modifierRecette('${r.id}')" class="btn-secondary">Modifier</button>
        </div>
        <a href="recette.html?id=${r.id}&from=admin" class="btn-primary">Voir</a>
      </div>
    </div>
  `).join("");
}

function supprimerProduit(id) {
  produits = produits.filter(p => p.id !== id);
  localStorage.setItem("produits", JSON.stringify(produits));
  afficherProduitsAdmin();
  showToast("Produit supprimé !");
}

function modifierProduit(id) {
  const produit = produits.find(p => p.id === id);
  if (!produit) return;
  
  document.getElementById("adminNom").value = produit.nom;
  document.getElementById("adminPrix").value = produit.prix;
  document.getElementById("adminCategorie").value = produit.categorie;
  document.getElementById("adminReduction").value = produit.reduction;
  document.getElementById("adminPoids").value = formatWeight(produit.poids);
  
  currentEditProductId = id;
  showToast("Prêt à modifier le produit");
}

function supprimerRecette(id) {
  recettes = recettes.filter(r => r.id !== id);
  localStorage.setItem("recettes", JSON.stringify(recettes));
  afficherRecettesAdmin();
  showToast("Recette supprimée !");
}

function modifierRecette(id) {
  const recette = recettes.find(r => r.id === id);
  if (!recette) return;
  
  document.getElementById("recetteTitre").value = recette.titre;
  document.getElementById("recetteIngredients").value = recette.ingredients.join(", ");
  document.getElementById("recetteQuantites").value = recette.quantites.join(", ");
  document.getElementById("recetteTemps").value = recette.temps;
  document.getElementById("recetteEtapes").value = recette.etapes.join("; ");
  
  currentEditRecipeId = id;
  showToast("Prêt à modifier la recette");
}

function initEspaceEntreprise() {
  const form = document.getElementById("entrepriseForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const nom = document.getElementById("entrepriseNom").value;
      const prix = parseFloat(document.getElementById("entreprisePrix").value);
      const cat = document.getElementById("entrepriseCategorie").value;
      const normalizedCat = cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
      const reduc = parseInt(document.getElementById("entrepriseReduction").value);
      const poidsInput = document.getElementById("entreprisePoids").value;
      
      const poids = parseWeightInput(poidsInput);
      
      if (currentEditProductId) {
        const index = produits.findIndex(p => p.id === currentEditProductId);
        if (index !== -1) {
          produits[index] = { 
            ...produits[index], 
            nom, 
            prix, 
            categorie: normalizedCat, 
            reduction: reduc, 
            poids 
          };
        }
        currentEditProductId = null;
      } else {
        const newId = Math.max(...produits.map(p => p.id), 0) + 1;
        produits.push({ 
          id: newId,
          nom, 
          prix, 
          categorie: normalizedCat, 
          reduction: reduc, 
          poids 
        });
      }
      
      localStorage.setItem("produits", JSON.stringify(produits));
      form.reset();
      showToast(currentEditProductId ? "Produit modifié !" : "Produit ajouté !");
      afficherProduitsEntreprise();
    });
  }
  
  afficherProduitsEntreprise();
}

function afficherProduitsEntreprise() {
  const div = document.getElementById("listeProduitsEntreprise");
  if (!div) return;
  
  div.innerHTML = produits.map(p => `
    <div class="produit-card">
      <div>
        <strong>${formatWeight(p.poids)} ${p.nom}</strong>
        <small>${p.categorie}</small>
        <span>Prix: ${p.prix.toFixed(2)}€ (-${p.reduction}%)</span>
      </div>
      <div class="product-actions">
        <button onclick="supprimerProduitEntreprise(${p.id})" class="btn-secondary">Supprimer</button>
        <button onclick="modifierProduitEntreprise(${p.id})" class="btn-secondary">Modifier</button>
      </div>
    </div>
  `).join("");
}

function supprimerProduitEntreprise(id) {
  produits = produits.filter(p => p.id !== id);
  localStorage.setItem("produits", JSON.stringify(produits));
  afficherProduitsEntreprise();
  showToast("Produit supprimé !");
}

function modifierProduitEntreprise(id) {
  const produit = produits.find(p => p.id === id);
  if (!produit) return;
  
  document.getElementById("entrepriseNom").value = produit.nom;
  document.getElementById("entreprisePrix").value = produit.prix;
  document.getElementById("entrepriseCategorie").value = produit.categorie;
  document.getElementById("entrepriseReduction").value = produit.reduction;
  document.getElementById("entreprisePoids").value = formatWeight(produit.poids);
  
  currentEditProductId = id;
  showToast("Prêt à modifier le produit");
}

function initCategoryFilter() {
  const categoryFilter = document.getElementById('categoryFilter');
  if (!categoryFilter) return;
  
  const categories = [...new Set(produits.map(p => 
    p.categorie.charAt(0).toUpperCase() + p.categorie.slice(1).toLowerCase()
  ))].sort();
  
  while (categoryFilter.options.length > 1) {
    categoryFilter.remove(1);
  }
  
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });
}

function sortByName() {
  const sortSelect = document.getElementById("sortName");
  if (!sortSelect) return;
  
  currentSortName = sortSelect.value;
  currentSortPrice = "default";
  document.getElementById("sortPrice").value = "default";
  afficherPromotions();
}

function sortByPrice() {
  const sortSelect = document.getElementById("sortPrice");
  if (!sortSelect) return;
  
  currentSortPrice = sortSelect.value;
  currentSortName = "default";
  document.getElementById("sortName").value = "default";
  afficherPromotions();
}

function filterProducts() {
  const categorySelect = document.getElementById("categoryFilter");
  if (!categorySelect) return;
  
  selectedCategory = categorySelect.value;
  afficherPromotions();
}

function afficherPromotions() {
  const div = document.getElementById("listePromotions");
  if (!div) return;
  
  let filteredProducts = selectedCategory === "Toutes" 
    ? [...produits] 
    : produits.filter(p => p.categorie.toLowerCase() === selectedCategory.toLowerCase());
  
  if (currentSortName !== "default") {
    filteredProducts.sort((a, b) => {
      const nameA = a.nom.toLowerCase();
      const nameB = b.nom.toLowerCase();
      return currentSortName === "asc" 
        ? nameA.localeCompare(nameB) 
        : nameB.localeCompare(nameA);
    });
  }
  
  if (currentSortPrice !== "default") {
    filteredProducts.sort((a, b) => {
      return currentSortPrice === "asc" 
        ? a.prix - b.prix 
        : b.prix - a.prix;
    });
  }
  
  div.innerHTML = filteredProducts.length ? filteredProducts.map(p => {
    const prixReduit = p.prix * (1 - p.reduction / 100);
    return `
      <div class="produit-card">
        <div>
          <strong>${formatWeight(p.poids)} ${p.nom}</strong>
          <small>${p.categorie}</small>
          <span><s>${p.prix.toFixed(2)}€</s> → ${prixReduit.toFixed(2)}€</span>
        </div>
        <button onclick="ajouterAuPanier(${p.id})" class="btn-primary">Ajouter</button>
      </div>
    `;
  }).join("") : '<p>Aucun produit en promotion</p>';
}

function afficherPanier() {
  const user = getCurrentUserData();
  if (!user || user.type !== "client") return;

  const div = document.getElementById("contenuPanier");
  if (!div) return;

  let total = 0;
  div.innerHTML = user.cart.length ? user.cart.map(item => {
    const prixRed = item.prix * (1 - item.reduction / 100);
    total += prixRed;
    return `
      <div class="panier-item">
        <div class="item-info">
          <strong>${formatWeight(item.poids)} ${item.nom}</strong>
          <div>${prixRed.toFixed(2)}€ (-${item.reduction}%)</div>
        </div>
        <button class="item-actions" onclick="supprimerDuPanier(${item.id})">✕</button>
      </div>
    `;
  }).join('') : '<p>Le panier est vide.</p>';

  const totalDiv = document.querySelector(".panier-total");
  if (totalDiv) {
    totalDiv.innerHTML = `<p>Total : ${total.toFixed(2)} €</p>`;
  }
}

function ajouterAuPanier(id) {
  const user = getCurrentUserData();
  if (!user || user.type !== "client") {
    showToast("Connectez-vous en tant que client pour ajouter au panier");
    setTimeout(() => window.location.href = "compte.html", 1500);
    return;
  }

  const produit = produits.find(p => p.id === id);
  if (!produit) return;

  user.cart.push({ 
    id: produit.id,
    nom: produit.nom, 
    prix: produit.prix, 
    reduction: produit.reduction, 
    poids: produit.poids 
  });
  
  saveUserData(user);
  showToast(`${produit.nom} ajouté au panier`);
  afficherPanier();
}

function supprimerDuPanier(id) {
  const user = getCurrentUserData();
  if (!user) return;

  const index = user.cart.findIndex(item => item.id === id);
  if (index > -1) user.cart.splice(index, 1);
  
  saveUserData(user);
  afficherPanier();
}

function validerCommande() {
  const user = getCurrentUserData();
  if (!user || user.type !== "client") {
    showToast("Connectez-vous en tant que client pour valider une commande");
    return;
  }

  if (user.cart.length === 0) {
    showToast("Le panier est vide !");
    return;
  }

  const nowISO = new Date().toISOString();
  let poidsTotal = 0;
  let economieTotale = 0;
  
  user.cart.forEach(item => {
    const poidsEnKg = convertToKg(item.poids);
    
    const prixPlein = item.prix;
    const prixReduit = prixPlein * (1 - item.reduction / 100);
    const economie = prixPlein - prixReduit;
    
    user.savings.totalNoDiscount += prixPlein;
    user.savings.totalSavings += economie;
    user.savings.totalWeightSaved += poidsEnKg;
    
    poidsTotal += poidsEnKg;
    economieTotale += economie;
    
    user.fridge.push(item);
    user.history.push({
      ...item,
      date: nowISO
    });
  });

  user.cart = [];
  saveUserData(user);
  
  showToast(`Commande validée ! ${poidsTotal.toFixed(2)}kg sauvés, ${economieTotale.toFixed(2)}€ économisés`);
  setTimeout(() => {
    window.location.href = "frigo.html";
  }, 1500);
}

function afficherFrigo() {
  const user = getCurrentUserData();
  if (!user || user.type !== "client") return;

  const div = document.getElementById("contenuFrigo");
  if (!div) return;

  const groupedItems = user.fridge.reduce((acc, item) => {
    if (!acc[item.id]) {
      acc[item.id] = { ...item, quantity: 0 };
    }
    acc[item.id].quantity += 1;
    return acc;
  }, {});

  const items = Object.values(groupedItems);

  div.innerHTML = items.length ? items.map(item => `
    <div class="panier-item">
      <div class="item-info">
        <strong>${item.quantity} × ${item.nom}</strong>
        <div>${formatWeight(item.poids)}</div>
      </div>
      <button class="item-actions" onclick="supprimerDuFrigo(${item.id})">✕</button>
    </div>
  `).join('') : '<p>Le frigo est vide.</p>';
}

function supprimerDuFrigo(id) {
  const user = getCurrentUserData();
  if (!user) return;

  const index = user.fridge.findIndex(p => p.id === id);
  if (index > -1) user.fridge.splice(index, 1);
  
  saveUserData(user);
  afficherFrigo();
}

function viderFrigo() {
  const user = getCurrentUserData();
  if (!user) return;

  user.fridge = [];
  saveUserData(user);
  afficherFrigo();
}

function afficherEconomies() {
  const user = getCurrentUserData();
  if (!user || user.type !== "client") return;

  const canvasDonut = document.getElementById("graphEconomiesDonut");
  if (canvasDonut) {
    if (window.econChartDonut) window.econChartDonut.destroy();
    
    window.econChartDonut = new Chart(canvasDonut, {
      type: 'doughnut',
      data: {
        labels: ['Dépensé', 'Économisé'],
        datasets: [{
          data: [user.savings.totalNoDiscount - user.savings.totalSavings, user.savings.totalSavings],
          backgroundColor: ['#e74c3c', '#2ecc71']
        }]
      },
      options: {
        cutout: '70%',
        plugins: { 
          legend: { 
            position: 'bottom',
            labels: { font: { size: 14 } }
          }
        }
      }
    });
  }

  const historyWithDates = user.history.filter(h => h.date);
  const monthlyData = {};
  
  historyWithDates.forEach(entry => {
    const month = entry.date.substring(0, 7);
    const saving = entry.prix * (entry.reduction / 100);
    const spent = entry.prix - saving;
    
    if (!monthlyData[month]) {
      monthlyData[month] = { saved: 0, spent: 0 };
    }
    
    monthlyData[month].saved += saving;
    monthlyData[month].spent += spent;
  });
  
  const months = Object.keys(monthlyData).sort();
  
  const canvasMonthly = document.getElementById("graphEconomiesMonthly");
  if (canvasMonthly) {
    if (window.econChartMonthly) window.econChartMonthly.destroy();
    
    window.econChartMonthly = new Chart(canvasMonthly, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Dépensé (€)',
            data: months.map(m => monthlyData[m].spent),
            backgroundColor: '#e74c3c'
          },
          {
            label: 'Économisé (€)',
            data: months.map(m => monthlyData[m].saved),
            backgroundColor: '#2ecc71'
          }
        ]
      },
      options: {
        scales: {
          x: { title: { display: true, text: 'Mois' } },
          y: { 
            title: { display: true, text: 'Montant (€)' },
            beginAtZero: true
          }
        }
      }
    });
  }

  const stats = document.getElementById("statistiques");
  if (stats) stats.innerHTML = `
    <p>Dépensé : ${(user.savings.totalNoDiscount - user.savings.totalSavings).toFixed(2)} €</p>
    <p>Économisé : ${user.savings.totalSavings.toFixed(2)} €</p>
    <p>Nourriture sauvée : ${user.savings.totalWeightSaved.toFixed(2)} kg</p>
  `;
}

function resetEconomies() {
  const user = getCurrentUserData();
  if (!user) return;

  user.savings = { totalNoDiscount: 0, totalSavings: 0, totalWeightSaved: 0 };
  user.history = [];
  saveUserData(user);
  afficherEconomies();
}

function afficherRecettes() {
  const divDispo = document.getElementById("recettesDisponibles");
  const divIndispo = document.getElementById("recettesIndisponibles");
  if (!divDispo || !divIndispo) return;

  const user = getCurrentUserData();
  const nomsFrigo = user?.fridge?.map(p => p.nom.toLowerCase()) || [];

  const recettesDispo = [];
  const recettesIndispo = [];

  recettes.forEach(r => {
    const disponible = r.ingredients.every(ing => 
      nomsFrigo.includes(ing.toLowerCase())
    );

    if (disponible) recettesDispo.push(r);
    else recettesIndispo.push(r);
  });

  divDispo.innerHTML = recettesDispo.length 
    ? recettesDispo.map(r => renderRecette(r, user)).join('') 
    : "<p>Aucune recette disponible.</p>";

  divIndispo.innerHTML = recettesIndispo.length 
    ? recettesIndispo.map(r => renderRecette(r, user)).join('') 
    : "<p>Toutes les recettes sont disponibles !</p>";
}

function renderRecette(r, user) {
  const isFavorite = user?.favorites?.includes(r.id);
  
  return `
    <div class="recette-card">
      <h3>${r.titre}</h3>
      <div class="recipe-actions">
        <button onclick="toggleFavori(event, '${r.id}')" class="btn-favorite">
          ${isFavorite ? "★ Favori" : "☆ Favori"}
        </button>
        <a href="recette.html?id=${r.id}" class="btn-primary">
          Voir la recette
        </a>
      </div>
    </div>
  `;
}

function toggleFavori(e, id) {
  e.preventDefault();
  const user = getCurrentUserData();
  if (!user) return;

  if (!user.favorites) user.favorites = [];
  
  const index = user.favorites.indexOf(id);
  if (index >= 0) {
    user.favorites.splice(index, 1);
    showToast("Recette retirée des favoris");
  } else {
    user.favorites.push(id);
    showToast("Recette ajoutée aux favoris");
  }
  
  saveUserData(user);
  afficherRecettes();
}

function afficherDetailRecette() {
  const target = document.getElementById("detailRecette");
  if (!target) return;
  
  const id = new URLSearchParams(location.search).get("id");
  const fromAdmin = new URLSearchParams(location.search).get("from") === "admin";
  const r = recettes.find(x => x.id === id);
  
  if (!r) {
    target.innerHTML = "<p>Recette non trouvée.</p>";
    return;
  }

  const ingredientsList = r.ingredients.map((ing, i) => 
    `<li>${r.quantites[i]} ${ing}</li>`
  ).join("");

  const etapesList = r.etapes.map(e => `<li>${e}</li>`).join("");

  target.innerHTML = `
    <h2>${r.titre}</h2>
    <p><strong>Temps :</strong> ${r.temps}</p>
    <p><strong>Ingrédients :</strong></p>
    <ul>${ingredientsList}</ul>
    <p><strong>Étapes :</strong></p>
    <ol>${etapesList}</ol>
    <div style="text-align: center; margin-top: 30px;">
      <button onclick="window.location.href='${fromAdmin ? 'admin-recettes.html' : 'recettes.html'}'" class="btn-primary">Retour</button>
    </div>
  `;
}

function afficherCompte() {
  const compteDiv = document.getElementById("compteContent");
  if (!compteDiv) return;

  const user = getCurrentUser();

  if (user) {
    const favoriteRecipes = user.favorites 
      ? recettes.filter(r => user.favorites.includes(r.id))
      : [];

    compteDiv.innerHTML = `
      <div class="compte-profile">
        <h2>Bienvenue, ${user.login} !</h2>
        <div class="profile-info">
          <p><strong>Type de compte :</strong> ${user.type}</p>
          <p><strong>Email :</strong> ${user.email}</p>
        </div>

        <div class="profile-stats">
          <div class="stat-card">
            <h3>Économies</h3>
            <p>${user.type === "client" ? (user.savings?.totalSavings?.toFixed(2) || "0.00") + " €" : "N/A"}</p>
          </div>
          <div class="stat-card">
            <h3>Recettes favorites</h3>
            <p>${user.type === "client" ? (user.favorites?.length || 0) : "N/A"}</p>
          </div>
          <div class="stat-card">
            <h3>Commandes</h3>
            <p>${user.type === "client" ? (user.history?.length || 0) : "N/A"}</p>
          </div>
          <div class="stat-card">
            <h3>Nourriture sauvée</h3>
            <p>${user.type === "client" ? (user.savings?.totalWeightSaved?.toFixed(2) || "0.00") + " kg" : "N/A"}</p>
          </div>
        </div>

        ${user.type === "client" && favoriteRecipes.length > 0 ? `
          <div class="favorites-section">
            <h3>Mes recettes favorites</h3>
            <div class="favorites-grid">
              ${favoriteRecipes.map(r => `
                <div class="favorite-card">
                  <h4>${r.titre}</h4>
                  <a href="recette.html?id=${r.id}" class="btn-small">Voir</a>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  } else {
    compteDiv.innerHTML = `
      <div class="compte-form">
        <form id="loginForm">
          <div class="form-group">
            <label for="username">Identifiant :</label>
            <input type="text" id="username" required class="form-input">
          </div>
          <div class="form-group">
            <label for="password">Mot de passe :</label>
            <input type="password" id="password" required class="form-input">
          </div>
          <button type="submit" class="btn-primary">Se connecter</button>
          <button type="button" id="signupBtn" class="btn-secondary">Créer compte</button>
        </form>
      </div>
    `;

    document.getElementById("signupBtn").addEventListener("click", () => {
      compteDiv.innerHTML = `
        <div class="compte-form">
          <form id="signupForm">
            <div class="form-group">
              <label for="newUsername">Nouvel identifiant :</label>
              <input type="text" id="newUsername" required class="form-input">
            </div>
            <div class="form-group">
              <label for="newEmail">Email :</label>
              <input type="email" id="newEmail" required class="form-input">
            </div>
            <div class="form-group">
              <label for="newPassword">Mot de passe :</label>
              <input type="password" id="newPassword" required class="form-input">
            </div>
            <button type="submit" class="btn-primary">S'inscrire</button>
            <button type="button" id="backToLogin" class="btn-secondary">Retour</button>
          </form>
        </div>
      `;

      document.getElementById("backToLogin").addEventListener("click", afficherCompte);

      document.getElementById("signupForm").addEventListener("submit", (e) => {
        e.preventDefault();
        const newUsername = document.getElementById("newUsername").value.trim();
        const newEmail = document.getElementById("newEmail").value.trim();
        const newPassword = document.getElementById("newPassword").value;

        if (users.find(u => u.login === newUsername)) {
          showToast("Ce nom d'utilisateur existe déjà !");
          return;
        }

        const newUser = {
          login: newUsername,
          email: newEmail,
          password: newPassword,
          type: "client",
          cart: [],
          fridge: [],
          savings: { totalNoDiscount: 0, totalSavings: 0, totalWeightSaved: 0 },
          favorites: [],
          history: []
        };

        users.push(newUser);
        localStorage.setItem("users", JSON.stringify(users));
        showToast("Compte créé ! Connectez-vous");
        setTimeout(afficherCompte, 1000);
      });
    });
    
    initAuth();
  }
}

window.onload = function() {
  if (!localStorage.getItem("users")) localStorage.setItem("users", JSON.stringify(users));
  if (!localStorage.getItem("produits")) localStorage.setItem("produits", JSON.stringify(produits));
  if (!localStorage.getItem("recettes")) localStorage.setItem("recettes", JSON.stringify(recettes));
  
  produits = JSON.parse(localStorage.getItem("produits")) || produits;
  recettes = JSON.parse(localStorage.getItem("recettes")) || recettes;
  
  initAuth();
  initAdmin();
  initEspaceEntreprise();
  
  if (document.getElementById("categoryFilter")) {
    initCategoryFilter();
  }
  
  afficherPromotions();
  afficherPanier();
  afficherEconomies();
  afficherRecettes();
  afficherFrigo();
  afficherDetailRecette();
  
  if (window.location.pathname.includes("compte.html")) {
    afficherCompte();
  }
  
  setTimeout(() => {
    document.querySelectorAll('.item, .produit, .recette').forEach(el => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });
  }, 100);
};