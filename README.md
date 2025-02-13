# Exportez la structure et le contenu de votre projet en Markdown
## Utilisation
```bash
npm i -g export2md 
```

```Usage: export2md [options] [chemin]

Options:
  -o, --output <fichier>    Spécifie le fichier de sortie (défaut: project-structure.md)
  -d, --depth <nombre>      Limite la profondeur de l'arborescence
  -e, --exclude <dossiers>  Liste de dossiers à exclure (séparés par des virgules)
  -h, --help               Affiche cette aide
```
---
### Exemples:
```
  export2md .
  export2md -o docs/structure.md
  export2md -d 2 -e temp,cache ./mon-projet

```

