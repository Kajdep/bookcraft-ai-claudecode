const fs = require('fs');
const path = require('path');

class BundleAnalyzer {
    constructor() {
        this.distPath = path.join(__dirname, 'dist', 'assets');
        this.totalSize = 0;
        this.analysis = {
            categories: {
                mermaid: { size: 0, files: [] },
                lexical: { size: 0, files: [] },
                react: { size: 0, files: [] },
                d3: { size: 0, files: [] },
                thirdParty: { size: 0, files: [] },
                application: { size: 0, files: [] }
            },
            recommendations: []
        };
    }

    analyzeBundle() {
        console.log('🔍 Analyzing bundle composition...');

        if (!fs.existsSync(this.distPath)) {
            console.error('Build output not found. Please run "npm run build" first.');
            return;
        }

        const files = fs.readdirSync(this.distPath);

        files.forEach(file => {
            const filePath = path.join(this.distPath, file);
            const stats = fs.statSync(filePath);

            if (stats.isFile()) {
                this.totalSize += stats.size;
                // Categorize files
                this.categorizeFile(file, stats.size);
            }
        });

        this.generateRecommendations();
        this.printReport();
    }

    categorizeFile(filename, size) {
        const categories = this.analysis.categories;

        if (filename.includes('mermaid') ||
            filename.includes('diagram') ||
            filename.includes('chart') ||
            filename.includes('graph')) {
            categories.mermaid.size += size;
            categories.mermaid.files.push({ name: filename, size });
        } else if (filename.includes('lexical') || filename.includes('editor')) {
            categories.lexical.size += size;
            categories.lexical.files.push({ name: filename, size });
        } else if (filename.includes('react') || filename.includes('jsx')) {
            categories.react.size += size;
            categories.react.files.push({ name: filename, size });
        } else if (filename.includes('d3') || filename.includes('linear') || filename.includes('ordinal')) {
            categories.d3.size += size;
            categories.d3.files.push({ name: filename, size });
        } else if (filename.includes('cytoscape') ||
                   filename.includes('katex') ||
                   filename.includes('treemap') ||
                   filename.includes('cose-bilkent')) {
            categories.thirdParty.size += size;
            categories.thirdParty.files.push({ name: filename, size });
        } else {
            categories.application.size += size;
            categories.application.files.push({ name: filename, size });
        }
    }

    generateRecommendations() {
        const { categories } = this.analysis;
        const totalSizeMB = this.totalSize / (1024 * 1024);

        // Overall bundle size
        if (totalSizeMB > 2) {
            this.analysis.recommendations.push({
                priority: 'High',
                category: 'Bundle Size',
                issue: `Total bundle size is ${totalSizeMB.toFixed(2)}MB`,
                impact: 'Slow initial load on slower connections',
                solution: 'Implement code splitting and lazy loading'
            });
        }

        // Mermaid diagrams taking up too much space
        const mermaidMB = categories.mermaid.size / (1024 * 1024);
        if (mermaidMB > 1) {
            this.analysis.recommendations.push({
                priority: 'High',
                category: 'Mermaid Library',
                issue: `Mermaid diagrams add ${mermaidMB.toFixed(2)}MB to bundle`,
                impact: 'Large bundle size from diagram library',
                solution: 'Lazy load Mermaid diagrams, only import needed diagram types'
            });
        }

        // Large third-party libraries
        const thirdPartyMB = categories.thirdParty.size / (1024 * 1024);
        if (thirdPartyMB > 0.5) {
            this.analysis.recommendations.push({
                priority: 'Medium',
                category: 'Third-party Libraries',
                issue: `Third-party libraries total ${thirdPartyMB.toFixed(2)}MB`,
                impact: 'Heavy dependencies affecting load time',
                solution: 'Evaluate necessity of large libraries, consider alternatives'
            });
        }

        // Lexical editor size
        const lexicalMB = categories.lexical.size / (1024 * 1024);
        if (lexicalMB > 0.3) {
            this.analysis.recommendations.push({
                priority: 'Medium',
                category: 'Lexical Editor',
                issue: `Lexical editor adds ${lexicalMB.toFixed(2)}MB`,
                impact: 'Rich text editor contributing to bundle size',
                solution: 'Only import necessary Lexical plugins'
            });
        }

        // Check for largest individual files
        const allFiles = Object.values(categories)
            .flatMap(cat => cat.files)
            .sort((a, b) => b.size - a.size);

        const largestFiles = allFiles.filter(f => f.size > 500 * 1024); // > 500KB
        if (largestFiles.length > 0) {
            this.analysis.recommendations.push({
                priority: 'Medium',
                category: 'Large Chunks',
                issue: `${largestFiles.length} files exceed 500KB`,
                impact: 'Large individual chunks may delay parsing',
                solution: 'Split large chunks using dynamic imports',
                files: largestFiles.slice(0, 5).map(f => ({
                    name: f.name,
                    sizeMB: (f.size / (1024 * 1024)).toFixed(2)
                }))
            });
        }
    }

    printReport() {
        console.log('\n' + '='.repeat(80));
        console.log('📦 BUNDLE ANALYSIS REPORT');
        console.log('='.repeat(80));

        const totalMB = (this.totalSize / (1024 * 1024)).toFixed(2);
        console.log(`Total Bundle Size: ${totalMB}MB\n`);

        console.log('📊 Size by Category:');
        Object.entries(this.analysis.categories).forEach(([name, data]) => {
            const sizeMB = (data.size / (1024 * 1024)).toFixed(2);
            const percentage = ((data.size / this.totalSize) * 100).toFixed(1);
            const bar = '█'.repeat(Math.floor(percentage / 2));
            console.log(`${name.padEnd(15)} ${sizeMB.padStart(8)}MB ${percentage.padStart(5)}% ${bar}`);
        });

        console.log('\n🔍 Largest Files:');
        const allFiles = Object.values(this.analysis.categories)
            .flatMap(cat => cat.files)
            .sort((a, b) => b.size - a.size)
            .slice(0, 10);

        allFiles.forEach((file, index) => {
            const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
            console.log(`${(index + 1).toString().padStart(2)}. ${file.name.substring(0, 50).padEnd(50)} ${sizeMB}MB`);
        });

        console.log('\n⚠️  OPTIMIZATION RECOMMENDATIONS:');
        this.analysis.recommendations.forEach((rec, index) => {
            console.log(`\n${index + 1}. [${rec.priority}] ${rec.category}`);
            console.log(`   Issue: ${rec.issue}`);
            console.log(`   Impact: ${rec.impact}`);
            console.log(`   Solution: ${rec.solution}`);
            if (rec.files) {
                console.log(`   Files: ${rec.files.map(f => `${f.name} (${f.sizeMB}MB)`).join(', ')}`);
            }
        });

        console.log('\n💡 IMMEDIATE ACTIONS:');

        // Dynamic import suggestions
        console.log('1. Implement lazy loading for Mermaid diagrams:');
        console.log('   const MermaidComponent = lazy(() => import("./MermaidDiagram"));');

        console.log('\n2. Add Vite chunk splitting configuration:');
        console.log(`   build: {
     rollupOptions: {
       output: {
         manualChunks: {
           'mermaid': ['mermaid'],
           'lexical': ['lexical', '@lexical/react'],
           'vendor': ['react', 'react-dom']
         }
       }
     }
   }`);

        console.log('\n3. Consider removing unused diagram types from Mermaid');
        console.log('4. Audit third-party dependencies for size optimization');

        console.log('\n' + '='.repeat(80));
    }

    saveReport() {
        const reportPath = path.join(__dirname, 'bundle-analysis-report.json');
        const report = {
            timestamp: new Date().toISOString(),
            totalSize: this.totalSize,
            totalSizeMB: (this.totalSize / (1024 * 1024)).toFixed(2),
            categories: this.analysis.categories,
            recommendations: this.analysis.recommendations
        };

        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    }
}

// Run analysis if called directly
if (require.main === module) {
    const analyzer = new BundleAnalyzer();
    analyzer.analyzeBundle();
    analyzer.saveReport();
}

module.exports = BundleAnalyzer;