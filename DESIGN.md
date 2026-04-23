---
version: alpha
name: Mission Héros du Matin
description: Une identité visuelle mobile-first pour une mini app enfant qui transforme la routine du matin en jeu de progression sain, joyeux et lisible pour un enfant de 6 ans.
colors:
  primary: "#2E5BFF"
  secondary: "#FF4D63"
  tertiary: "#FFD447"
  success: "#2CCB73"
  surface: "#F8FBFF"
  shell: "#E8F0FF"
  ink: "#15254B"
  ink-soft: "#5F709C"
typography:
  hero:
    fontFamily: Bangers
    fontSize: 3rem
    fontWeight: 400
    lineHeight: 1
    letterSpacing: 0.02em
  title:
    fontFamily: Baloo 2
    fontSize: 1.5rem
    fontWeight: 800
    lineHeight: 1.1
  body:
    fontFamily: Baloo 2
    fontSize: 1rem
    fontWeight: 600
    lineHeight: 1.45
  label:
    fontFamily: Baloo 2
    fontSize: 0.82rem
    fontWeight: 800
    lineHeight: 1
    letterSpacing: 0.08em
rounded:
  sm: 18px
  md: 24px
  lg: 32px
spacing:
  xs: 8px
  sm: 12px
  md: 20px
  lg: 28px
  xl: 40px
components:
  page-shell:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  hero-panel:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "{spacing.xl}"
  task-card:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "{spacing.lg}"
  task-card-alt:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "{spacing.lg}"
  reward-panel:
    backgroundColor: "{colors.success}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "{spacing.lg}"
  stats-chip:
    backgroundColor: "{colors.shell}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "{spacing.sm}"
  helper-copy:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.sm}"
    padding: "{spacing.sm}"
---

## Vue d'ensemble

Cette app doit ressembler à un quartier général de petit héros.
Le mélange visuel s'inspire des rouges francs de super-héros, des bleus électriques de jeux d'action, et des jaunes coffre façon pièces ou badges.
Le résultat attendu n'est pas une copie de licence, mais une ambiance immédiatement familière et joyeuse pour un garçon de 6 ans.

La règle produit doit rester simple:

- une seule mission principale par écran
- quatre cartes très lisibles
- un état verrouillé puis déverrouillé
- une récompense famille douce, pas une machine à sucre

## Couleurs

La palette repose sur quatre couleurs d'action et deux neutres clairs:

- **Primary (`#2E5BFF`)**: bleu turbo pour le héros, la progression et l'état "jeu débloqué".
- **Secondary (`#FF4D63`)**: rouge dynamique pour l'énergie, l'appel à l'action et l'esprit aventure.
- **Tertiary (`#FFD447`)**: jaune trésor pour les badges, coffres et moments de célébration.
- **Success (`#2CCB73`)**: vert validation pour la routine réussie et les récompenses saines.
- **Surface (`#F8FBFF`)**: base lumineuse et légère, jamais blanche plate.
- **Shell (`#E8F0FF`)**: couche secondaire pour les puces, tableaux et cartes de soutien.
- **Ink (`#15254B`)**: texte principal, solide et lisible sur mobile.
- **Ink Soft (`#5F709C`)**: texte secondaire, jamais aussi important que l'action.

Les surfaces doivent toujours garder une profondeur douce: dégradés, halos, ombres larges, mais sans bruit inutile.

## Typographie

Deux familles suffisent:

- **Hero** pour les grands titres: expressif, presque affichiste, très mémorable.
- **Title / Body / Label** pour tout le reste: rond, amical, lisible par un parent et simple à suivre pour un enfant.

La hiérarchie est volontairement exagérée pour que l'écran se comprenne d'un seul regard.

## Mise en page

La page doit être pensée en mobile d'abord.
Tout ce qui compte doit apparaître sans chercher:

1. l'état global "jeu verrouillé ou débloqué"
2. les quatre cartes de mission
3. le coffre famille
4. les coffres et les badges de série

L'espacement doit être généreux, avec des blocs denses mais respirants.
Sur desktop, l'interface peut s'élargir, mais elle doit conserver une sensation d'application téléphone posée sur un bureau.

## Relief et profondeur

La profondeur doit rappeler un jouet premium:

- grandes ombres floues
- halos colorés très doux
- cartes légèrement bombées
- superposition de plans, mais jamais au détriment de la lisibilité

La profondeur sert à créer du "waouh", pas à compliquer l'usage.

## Formes

Les formes doivent être arrondies et rassurantes.
Pas d'angles agressifs.
Les gros rayons de bord donnent immédiatement une impression enfantine, tactile et moderne.

Le système visuel doit alterner:

- pastilles rondes pour les statuts
- grandes cartes coussin pour les actions
- capsules pour les badges

## Composants

Les composants principaux sont:

- **Panneau héros**: grand état de progression avec jauge, message fort et sensation de console verrouillée.
- **Carte mission**: une mission par carte, accent fort, icône simple, texte court, bouton massif.
- **Panneau coffres**: trois coffres lisibles, bronze chaque jour validé, argent toutes les deux réussites, doré toutes les sept réussites.
- **Badge de suivi**: repères secondaires pour l'historique, la série et les parents.

Chaque composant doit être compréhensible en moins de deux secondes.

## À faire et à éviter

À faire:

- célébrer les efforts avec chaleur
- garder un langage court et positif
- montrer clairement la progression vers le jeu
- privilégier les récompenses variées et saines

À éviter:

- noyer l'enfant dans trop d'options
- culpabiliser quand une mission n'est pas faite
- rendre le sucre central dans la boucle de récompense
- surcharger l'écran avec des détails secondaires
