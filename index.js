#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration par défaut
const defaultConfig = {
    excludedFolders: ['node_modules', '.git', 'dist', 'build', 'coverage'],
    excludedFiles: ['.DS_Store', 'thumbs.db', '.env', '.gitignore', 'package-lock.json'],
    binaryExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.zip', '.tar', '.gz'],
    maxDepth: -1
};

// Mapping des extensions vers les langages
const languageMap = {
    '.js': 'javascript',
    '.jsx': 'jsx',
    '.ts': 'typescript',
    '.tsx': 'tsx',
    '.html': 'html',
    '.css': 'css',
    '.scss': 'scss',
    '.json': 'json',
    '.xml': 'xml',
    '.md': 'markdown',
    '.py': 'python',
    '.java': 'java',
    '.php': 'php',
    '.sql': 'sql',
    '.sh': 'bash',
    '.yaml': 'yaml',
    '.yml': 'yaml'
};

// Caractères pour l'arbre
const treeChars = {
    pipe: '│',
    tee: '├',
    last: '└',
    blank: ' ',
    dash: '─'
};

function getLanguageFromExtension(filename) {
    const ext = path.extname(filename).toLowerCase();
    return languageMap[ext] || 'plaintext';
}

function formatFileContent(content, language) {
    return `\`\`\`${language}\n${content}\n\`\`\``;
}

function generateTreeStructure(rootPath, config = {}, prefix = '', isLast = true) {
    const finalConfig = { ...defaultConfig, ...config };
    let treeOutput = '';

    try {
        const items = fs.readdirSync(rootPath);
        const filteredItems = items.filter(item => {
            const stats = fs.statSync(path.join(rootPath, item));
            if (stats.isDirectory()) {
                return !finalConfig.excludedFolders.includes(item);
            }
            return !finalConfig.excludedFiles.includes(item);
        });

        filteredItems.forEach((item, index) => {
            const isLastItem = index === filteredItems.length - 1;
            const fullPath = path.join(rootPath, item);
            const stats = fs.statSync(fullPath);

            const connector = isLastItem ? treeChars.last : treeChars.tee;
            const itemPrefix = `${prefix}${connector}${treeChars.dash} `;
            const childPrefix = `${prefix}${isLastItem ? treeChars.blank : treeChars.pipe}  `;

            if (stats.isDirectory()) {
                treeOutput += `${itemPrefix}📁 ${item}/\n`;
                treeOutput += generateTreeStructure(fullPath, config, childPrefix, isLastItem);
            } else {
                treeOutput += `${itemPrefix}📄 ${item}\n`;
            }
        });

        return treeOutput;
    } catch (error) {
        return `Erreur: ${error.message}\n`;
    }
}

function generateProjectStructure(rootPath, config = {}, currentDepth = 0) {
    const finalConfig = { ...defaultConfig, ...config };
    let markdown = '';

    if (finalConfig.maxDepth !== -1 && currentDepth > finalConfig.maxDepth) {
        return markdown;
    }

    try {
        const items = fs.readdirSync(rootPath);

        for (const item of items) {
            const fullPath = path.join(rootPath, item);
            const stats = fs.statSync(fullPath);
            const indent = '  '.repeat(currentDepth);

            if (stats.isDirectory()) {
                if (finalConfig.excludedFolders.includes(item)) {
                    continue;
                }

                markdown += `${indent}- 📁 **${item}/**\n`;
                markdown += generateProjectStructure(fullPath, finalConfig, currentDepth + 1);

            } else {
                if (finalConfig.excludedFiles.includes(item)) {
                    continue;
                }

                const ext = path.extname(item).toLowerCase();
                if (finalConfig.binaryExtensions.includes(ext)) {
                    markdown += `${indent}- 📄 **${item}** (fichier binaire)\n`;
                } else {
                    try {
                        const fileContent = fs.readFileSync(fullPath, 'utf8');
                        const lineCount = fileContent.split('\n').length;
                        const language = getLanguageFromExtension(item);

                        markdown += `${indent}- 📄 **${item}** (${lineCount} lignes)\n\n`;
                        markdown += `${indent}  <details>\n`;
                        markdown += `${indent}  <summary>Voir le contenu</summary>\n\n`;
                        markdown += `${indent}  ${formatFileContent(fileContent, language)}\n`;
                        markdown += `${indent}  </details>\n\n`;
                    } catch (error) {
                        markdown += `${indent}- 📄 **${item}** (impossible de lire le contenu)\n`;
                    }
                }
            }
        }

        return markdown;
    } catch (error) {
        return `Erreur lors de la lecture du dossier: ${error.message}\n`;
    }
}

function saveProjectStructure(rootPath, outputPath, config = {}) {
    const projectName = path.basename(rootPath);

    // Génération de l'arbre visuel
    const treeStructure = generateTreeStructure(rootPath, config);

    // Génération de la structure détaillée avec contenu
    const detailedStructure = generateProjectStructure(rootPath, config);

    const content = `# Structure du projet ${projectName}\n\n` +
        `Généré le ${new Date().toLocaleString('fr-FR')}\n\n` +
        `## Vue arborescente\n\n` +
        `\`\`\`\n` +
        `📁 ${projectName}/\n` +
        `${treeStructure}` +
        `\`\`\`\n\n` +
        `## Structure détaillée avec contenu\n\n` +
        `📁 **Racine du projet: ${projectName}**\n\n` +
        `${detailedStructure}`;

    fs.writeFileSync(outputPath, content, 'utf8');
    console.log(`Structure du projet sauvegardée dans ${outputPath}`);
}

module.exports = {
    generateProjectStructure,
    generateTreeStructure,
    saveProjectStructure
};

if (require.main === module) {
    const projectPath = process.argv[2] || '.';
    const outputPath = process.argv[3] || 'project-structure.md';

    saveProjectStructure(projectPath, outputPath, {
        excludedFolders: [...defaultConfig.excludedFolders],
        maxDepth: -1
    });
}

function parseArguments() {
    const args = process.argv.slice(2);
    const options = {
        path: '.',
        output: 'project-structure.md',
        config: {}
    };

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '-o':
            case '--output':
                options.output = args[++i];
                break;
            case '-d':
            case '--depth':
                options.config.maxDepth = parseInt(args[++i]);
                break;
            case '-e':
            case '--exclude':
                const excludes = args[++i].split(',');
                options.config.excludedFolders = [...defaultConfig.excludedFolders, ...excludes];
                break;
            case '-h':
            case '--help':
                showHelp();
                process.exit(0);
                break;
            default:
                if (args[i].startsWith('-')) {
                    console.error(`Option inconnue: ${args[i]}`);
                    showHelp();
                    process.exit(1);
                } else {
                    options.path = args[i];
                }
        }
    }

    return options;
}

function showHelp() {
    console.log(`
Usage: export2md [options] [chemin]

Options:
  -o, --output <fichier>    Spécifie le fichier de sortie (défaut: project-structure.md)
  -d, --depth <nombre>      Limite la profondeur de l'arborescence
  -e, --exclude <dossiers>  Liste de dossiers à exclure (séparés par des virgules)
  -h, --help               Affiche cette aide

Exemples:
  export2md .
  export2md -o docs/structure.md
  export2md -d 2 -e temp,cache ./mon-projet
`);
}

// Point d'entrée CLI
if (require.main === module) {
    const options = parseArguments();
    saveProjectStructure(options.path, options.output, options.config);
}