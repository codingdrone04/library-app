#!/bin/bash

echo "========================================="
echo "Test de connexion SSH pour CI/CD"
echo "========================================="
echo ""

# Test 1: Connexion SSH
echo "Test 1: Connexion SSH à artemis..."
if ssh artemis "echo 'Connexion réussie!'" 2>/dev/null; then
    echo "✅ Connexion SSH OK"
else
    echo "❌ Erreur de connexion SSH"
    exit 1
fi
echo ""

# Test 2: Vérification du chemin du projet
echo "Test 2: Vérification du chemin du projet..."
if ssh artemis "cd ~/UNCOVE/SAMOUEL/library-app && pwd" 2>/dev/null; then
    echo "✅ Chemin du projet OK"
else
    echo "❌ Chemin du projet introuvable"
    exit 1
fi
echo ""

# Test 3: Vérification de Git
echo "Test 3: Vérification de Git..."
if ssh artemis "cd ~/UNCOVE/SAMOUEL/library-app && git status" 2>/dev/null; then
    echo "✅ Git OK"
else
    echo "❌ Problème avec Git"
    exit 1
fi
echo ""

# Test 4: Vérification de Docker
echo "Test 4: Vérification de Docker..."
if ssh artemis "docker --version" 2>/dev/null; then
    echo "✅ Docker installé"
else
    echo "❌ Docker non trouvé"
    exit 1
fi
echo ""

# Test 5: Vérification du backend
echo "Test 5: Vérification du dossier backend..."
if ssh artemis "cd ~/UNCOVE/SAMOUEL/library-app/library-backend && ls docker-compose.yaml" 2>/dev/null; then
    echo "✅ Backend et docker-compose.yaml trouvés"
else
    echo "❌ Backend ou docker-compose.yaml introuvable"
    exit 1
fi
echo ""

# Afficher la clé publique
echo "========================================="
echo "Clé publique SSH (pour référence)"
echo "========================================="
cat ~/.ssh/id_ed25519.pub
echo ""

echo "========================================="
echo "Tous les tests sont OK! ✅"
echo "========================================="
echo ""
echo "Prochaine étape :"
echo "1. Copiez votre clé privée : cat ~/.ssh/id_ed25519 | pbcopy"
echo "2. Ajoutez-la sur GitHub → Settings → Secrets → SSH_PRIVATE_KEY"
echo "3. Push sur master et regardez le workflow s'exécuter!"
