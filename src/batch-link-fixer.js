/**
 * 批量链接修复工具
 * 用于修复所有HTML文件中的链接问题
 */

const fs = require('fs');
const path = require('path');

class BatchLinkFixer {
    constructor(rootDir) {
        this.rootDir = rootDir;
        this.htmlFiles = [];
        this.linkMap = new Map();
        this.fixedLinks = new Set();
        this.stats = {
            filesProcessed: 0,
            linksChecked: 0,
            linksBroken: 0,
            linksFixed: 0
        };
    }

    // 执行批量修复
    async fix() {
        console.log('🔧 开始批量链接修复...');
        
        // 1. 扫描所有HTML文件
        this.scanHtmlFiles();
        console.log(`📁 找到 ${this.htmlFiles.length} 个HTML文件`);
        
        // 2. 分析所有链接
        this.analyzeLinks();
        console.log(`🔗 分析了 ${this.stats.linksChecked} 个链接`);
        
        // 3. 修复损坏的链接
        await this.fixBrokenLinks();
        
        // 4. 生成报告
        this.generateReport();
        
        console.log('✅ 批量链接修复完成！');
    }

    // 扫描HTML文件
    scanHtmlFiles() {
        const scanDir = (dir) => {
            const files = fs.readdirSync(dir);
            
            for (const file of files) {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);
                
                if (stat.isDirectory()) {
                    scanDir(filePath);
                } else if (file.endsWith('.html')) {
                    this.htmlFiles.push(filePath);
                }
            }
        };
        
        scanDir(this.rootDir);
    }

    // 分析所有链接
    analyzeLinks() {
        for (const filePath of this.htmlFiles) {
            this.analyzeFileLinks(filePath);
            this.stats.filesProcessed++;
        }
    }

    // 分析单个文件的链接
    analyzeFileLinks(filePath) {
        const content = fs.readFileSync(filePath, 'utf8');
        const relativeDir = path.dirname(path.relative(this.rootDir, filePath));
        
        // 匹配所有 href 属性
        const hrefRegex = /href\s*=\s*["']([^"']+)["']/gi;
        let match;
        
        while ((match = hrefRegex.exec(content)) !== null) {
            const href = match[1];
            this.stats.linksChecked++;
            
            if (this.isInternalLink(href)) {
                const absolutePath = this.resolveRelativePath(href, filePath, relativeDir);
                
                if (!this.linkMap.has(href)) {
                    this.linkMap.set(href, {
                        originalHref: href,
                        resolvedPath: absolutePath,
                        usedIn: [],
                        exists: this.checkFileExists(absolutePath)
                    });
                }
                
                this.linkMap.get(href).usedIn.push({
                    file: filePath,
                    position: match.index
                });
            }
        }
    }

    // 检查是否为内部链接
    isInternalLink(href) {
        return href && 
               !href.startsWith('http://') &&
               !href.startsWith('https://') &&
               !href.startsWith('mailto:') &&
               !href.startsWith('tel:') &&
               !href.startsWith('//');
    }

    // 解析相对路径
    resolveRelativePath(href, currentFile, relativeDir) {
        if (href.startsWith('#')) {
            return null; // 锚点链接
        }
        
        if (href.startsWith('/')) {
            return path.join(this.rootDir, href.substring(1));
        }
        
        const currentDir = path.dirname(currentFile);
        return path.resolve(currentDir, href);
    }

    // 检查文件是否存在
    checkFileExists(filePath) {
        if (!filePath) return true; // 锚点链接视为存在
        
        try {
            return fs.existsSync(filePath);
        } catch (error) {
            return false;
        }
    }

    // 修复损坏的链接
    async fixBrokenLinks() {
        console.log('🔧 开始修复损坏的链接...');
        
        for (const [originalHref, linkInfo] of this.linkMap) {
            if (!linkInfo.exists) {
                this.stats.linksBroken++;
                const fixedHref = this.findCorrectLink(originalHref, linkInfo);
                
                if (fixedHref) {
                    await this.applyLinkFix(originalHref, fixedHref, linkInfo);
                    this.stats.linksFixed++;
                } else {
                    console.warn(`❌ 无法修复链接: ${originalHref}`);
                }
            }
        }
    }

    // 查找正确的链接
    findCorrectLink(originalHref, linkInfo) {
        const fileName = path.basename(originalHref);
        const fileNameWithoutExt = path.parse(fileName).name;
        
        // 策略1: 在根目录查找同名文件
        const rootMatch = this.findFileInDirectory(this.rootDir, fileName);
        if (rootMatch) {
            return this.getRelativeHref(rootMatch, linkInfo.usedIn[0].file);
        }
        
        // 策略2: 查找相似名称的文件
        const similarFiles = this.findSimilarFiles(fileNameWithoutExt);
        if (similarFiles.length > 0) {
            return this.getRelativeHref(similarFiles[0], linkInfo.usedIn[0].file);
        }
        
        // 策略3: 常见修复
        const commonFixes = {
            'contact.html': 'contacts.html',
            'contac.html': 'contacts.html',
            'aboutus.html': 'about.html',
            'home.html': 'index.html'
        };
        
        if (commonFixes[fileName]) {
            const fixedPath = this.findFileInDirectory(this.rootDir, commonFixes[fileName]);
            if (fixedPath) {
                return this.getRelativeHref(fixedPath, linkInfo.usedIn[0].file);
            }
        }
        
        // 策略4: 添加 .html 扩展名
        if (!fileName.includes('.')) {
            const withExtension = fileName + '.html';
            const matchWithExt = this.findFileInDirectory(this.rootDir, withExtension);
            if (matchWithExt) {
                return this.getRelativeHref(matchWithExt, linkInfo.usedIn[0].file);
            }
        }
        
        return null;
    }

    // 在目录中查找文件
    findFileInDirectory(dir, fileName) {
        const findInDir = (currentDir) => {
            try {
                const files = fs.readdirSync(currentDir);
                
                for (const file of files) {
                    const filePath = path.join(currentDir, file);
                    const stat = fs.statSync(filePath);
                    
                    if (stat.isDirectory()) {
                        const found = findInDir(filePath);
                        if (found) return found;
                    } else if (file.toLowerCase() === fileName.toLowerCase()) {
                        return filePath;
                    }
                }
            } catch (error) {
                // 忽略权限错误等
            }
            
            return null;
        };
        
        return findInDir(dir);
    }

    // 查找相似文件
    findSimilarFiles(baseName) {
        const allFiles = [];
        
        const collectFiles = (dir) => {
            try {
                const files = fs.readdirSync(dir);
                
                for (const file of files) {
                    const filePath = path.join(dir, file);
                    const stat = fs.statSync(filePath);
                    
                    if (stat.isDirectory()) {
                        collectFiles(filePath);
                    } else if (file.endsWith('.html')) {
                        allFiles.push(filePath);
                    }
                }
            } catch (error) {
                // 忽略错误
            }
        };
        
        collectFiles(this.rootDir);
        
        // 查找包含相似名称的文件
        return allFiles.filter(filePath => {
            const fileName = path.parse(path.basename(filePath)).name.toLowerCase();
            const targetName = baseName.toLowerCase();
            
            return fileName.includes(targetName) || targetName.includes(fileName);
        });
    }

    // 获取相对href
    getRelativeHref(targetPath, fromFile) {
        const fromDir = path.dirname(fromFile);
        let relativePath = path.relative(fromDir, targetPath);
        
        // 在Windows上确保使用正斜杠
        relativePath = relativePath.replace(/\\/g, '/');
        
        // 如果在同一目录，不需要 ./
        if (!relativePath.startsWith('../') && !relativePath.startsWith('/')) {
            if (!relativePath.startsWith('./')) {
                relativePath = './' + relativePath;
            }
        }
        
        return relativePath;
    }

    // 应用链接修复
    async applyLinkFix(originalHref, fixedHref, linkInfo) {
        console.log(`🔧 修复链接: ${originalHref} → ${fixedHref}`);
        
        for (const usage of linkInfo.usedIn) {
            let content = fs.readFileSync(usage.file, 'utf8');
            
            // 替换所有出现的此链接
            const regex = new RegExp(`href\\s*=\\s*["']${this.escapeRegex(originalHref)}["']`, 'gi');
            content = content.replace(regex, `href="${fixedHref}"`);
            
            fs.writeFileSync(usage.file, content, 'utf8');
        }
        
        this.fixedLinks.add(originalHref);
    }

    // 转义正则表达式特殊字符
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // 生成报告
    generateReport() {
        const report = `# 链接修复报告

## 统计信息
- 处理文件数: ${this.stats.filesProcessed}
- 检查链接数: ${this.stats.linksChecked}
- 损坏链接数: ${this.stats.linksBroken}
- 成功修复数: ${this.stats.linksFixed}

## 修复详情
${Array.from(this.fixedLinks).map(link => `- ✅ ${link}`).join('\n')}

## 未修复的链接
${Array.from(this.linkMap.entries())
    .filter(([href, info]) => !info.exists && !this.fixedLinks.has(href))
    .map(([href]) => `- ❌ ${href}`)
    .join('\n')}

生成时间: ${new Date().toLocaleString()}
`;

        const reportPath = path.join(this.rootDir, 'link-fix-report.md');
        fs.writeFileSync(reportPath, report, 'utf8');
        
        console.log(`📊 报告已生成: ${reportPath}`);
        console.log(report);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    const rootDir = process.argv[2] || './';
    const fixer = new BatchLinkFixer(rootDir);
    
    fixer.fix().catch(error => {
        console.error('❌ 修复过程中出错:', error);
        process.exit(1);
    });
}

module.exports = BatchLinkFixer;
