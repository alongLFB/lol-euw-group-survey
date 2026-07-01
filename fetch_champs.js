const https = require('https');
const fs = require('fs');

// First fetch the latest version
https.get('https://ddragon.leagueoflegends.com/api/versions.json', (res) => {
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
        try {
            const versions = JSON.parse(data);
            const latestVersion = versions[0];
            console.log(`获取到最新的 LOL 版本: ${latestVersion}`);
            fetchChampions(latestVersion);
        } catch (e) {
            console.error("解析版本信息失败", e);
        }
    });
}).on('error', (e) => {
    console.error("获取版本失败:", e);
});

function fetchChampions(version) {
    const url = `https://ddragon.leagueoflegends.com/cdn/${version}/data/zh_CN/champion.json`;
    console.log(`正在从 ${url} 获取英雄数据...`);
    
    https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
            const json = JSON.parse(data);
            const champs = json.data;
            const roleMap = {
                'Top': [],
                'Jungle': [],
                'Mid': [],
                'ADC': [],
                'Support': []
            };
            
            Object.values(champs).forEach(champ => {
                const tags = champ.tags;
                const entry = `${champ.name} (${champ.id})`;
                
                // Heuristic mapping
                if (tags.includes('Marksman')) roleMap['ADC'].push(entry);
                if (tags.includes('Support')) roleMap['Support'].push(entry);
                if (tags.includes('Mage') || tags.includes('Assassin')) roleMap['Mid'].push(entry);
                if (tags.includes('Fighter') || tags.includes('Tank')) {
                    roleMap['Top'].push(entry);
                    roleMap['Jungle'].push(entry);
                }
            });
            
            const output = `const championsByRole = ${JSON.stringify(roleMap, null, 4)};`;
            fs.writeFileSync('js/champions.js', output);
            console.log(`成功拉取 ${Object.keys(champs).length} 位英雄并更新至 js/champions.js！`);
        });
    }).on('error', (e) => {
        console.error("获取英雄数据失败:", e);
    });
}
