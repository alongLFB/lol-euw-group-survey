document.addEventListener('DOMContentLoaded', async () => {
    let data = [];
    const adminKey = sessionStorage.getItem('adminKey');
    const isAdmin = !!adminKey;
    
    // UI Elements
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    const adminModal = document.getElementById('adminModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const submitAdminKeyBtn = document.getElementById('submitAdminKeyBtn');
    const adminKeyInput = document.getElementById('adminKeyInput');
    const adminPanel = document.getElementById('adminPanel');
    const tableBody = document.getElementById('adminTableBody');

    // 1. Admin Authorization State Handling
    if (isAdmin) {
        if (adminLoginBtn) adminLoginBtn.textContent = '🚪 退出管理员';
        if (adminPanel) adminPanel.style.display = 'block';
    } else {
        if (adminLoginBtn) adminLoginBtn.textContent = '🔑 管理员登录';
        if (adminPanel) adminPanel.style.display = 'none';
    }

    // Modal Events
    if (adminLoginBtn) {
        adminLoginBtn.addEventListener('click', () => {
            if (isAdmin) {
                // Logout
                sessionStorage.removeItem('adminKey');
                alert('已退出管理员模式');
                window.location.reload();
            } else {
                // Show login modal
                adminModal.style.display = 'flex';
                adminKeyInput.focus();
            }
        });
    }

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            adminModal.style.display = 'none';
            adminKeyInput.value = '';
        });
    }

    // Close modal on click outside
    window.addEventListener('click', (e) => {
        if (e.target === adminModal) {
            adminModal.style.display = 'none';
            adminKeyInput.value = '';
        }
    });

    if (submitAdminKeyBtn) {
        submitAdminKeyBtn.addEventListener('click', () => {
            const key = adminKeyInput.value.trim();
            if (key) {
                sessionStorage.setItem('adminKey', key);
                adminModal.style.display = 'none';
                window.location.reload();
            } else {
                alert('请输入密钥！');
            }
        });
    }

    // 2. Fetch data from Server
    try {
        const url = isAdmin ? '/api/admin/survey' : '/api/survey';
        const headers = isAdmin ? { 'x-admin-key': adminKey } : {};
        
        const response = await fetch(url, { headers });
        if (response.ok) {
            data = await response.json();
        } else {
            if (response.status === 401 && isAdmin) {
                // Invalid key, clear and revert to guest mode
                sessionStorage.removeItem('adminKey');
                alert('密钥错误，验证失败！');
                window.location.reload();
            } else {
                console.error('Failed to fetch survey data, status:', response.status);
            }
        }
    } catch (error) {
        console.error('Error fetching data from server:', error);
    }

    // Handle Empty Database State
    if (!data || data.length === 0) {
        const container = document.querySelector('.dashboard-grid');
        if (container) {
            const emptyState = document.createElement('div');
            emptyState.className = 'glass-card text-center';
            emptyState.style.gridColumn = '1 / -1';
            emptyState.style.padding = '3.5rem 2rem';
            emptyState.style.marginBottom = '1.5rem';
            emptyState.innerHTML = `
                <h2 style="font-size: 1.8rem; margin-bottom: 1rem; color: #fca5a5;">📊 暂无问卷数据</h2>
                <p style="color: var(--text-muted); margin-bottom: 2rem; max-width: 500px; margin-left: auto; margin-right: auto;">目前数据库中还没有人填写问卷。请点击下方按钮开始填写，提交后即可查看实时看板统计！</p>
                <a href="index.html" class="btn-primary" style="display: inline-block; width: auto; text-decoration: none; padding: 0.8rem 2.5rem; border-radius: 12px;">去填写群友资料 ✍️</a>
            `;
            container.prepend(emptyState);
        }
    }

    // 3. Compute Summary Stats
    const totalMembers = data.length;
    document.getElementById('totalMembers').innerText = totalMembers;

    const ages = data.map(d => parseInt(d.age)).filter(a => !isNaN(a));
    const avgAge = ages.length ? Math.round(ages.reduce((a,b)=>a+b,0) / ages.length) : 0;
    document.getElementById('avgAge').innerText = avgAge || '-';

    const canMicCount = data.filter(d => d.voiceChat === '可以开麦').length;
    const micRatio = totalMembers ? Math.round((canMicCount / totalMembers) * 100) : 0;
    document.getElementById('micRatio').innerText = micRatio + '%';

    // 4. Render Admin Table (if admin)
    if (isAdmin && tableBody) {
        if (data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="15" style="text-align: center; color: var(--text-muted); padding: 3rem;">暂无提交明细记录</td></tr>`;
        } else {
            tableBody.innerHTML = data.map(d => {
                const formattedTime = d.timestamp ? new Date(d.timestamp).toLocaleString('zh-CN') : '-';
                return `
                    <tr>
                        <td style="padding: 1rem; font-weight: 500; color: #fff;">${d.nickname || '-'}</td>
                        <td style="padding: 1rem;">${d.wechatId || '-'}</td>
                        <td style="padding: 1rem; font-family: monospace; color: #818cf8;">${d.gameId || '-'}</td>
                        <td style="padding: 1rem; color: #38bdf8;">${d.email || '-'}</td>
                        <td style="padding: 1rem;">${d.age || '-'}</td>
                        <td style="padding: 1rem;">${d.gender === 'Male' ? '男生 🙋‍♂️' : '女生 🙋‍♀️'}</td>
                        <td style="padding: 1rem;">${d.region || '-'}</td>
                        <td style="padding: 1rem;">${d.playYears || '-'}</td>
                        <td style="padding: 1rem;">${d.rank || '-'}</td>
                        <td style="padding: 1rem;">${d.position || '-'}</td>
                        <td style="padding: 1rem;">${d.activeTime || '-'}</td>
                        <td style="padding: 1rem;">${d.playStyle || '-'}</td>
                        <td style="padding: 1rem;">${d.voiceChat || '-'}</td>
                        <td style="padding: 1rem;">${d.favoriteChampions || '-'}</td>
                        <td style="padding: 1rem; color: var(--text-muted); font-size: 0.8rem;">${formattedTime}</td>
                    </tr>
                `;
            }).join('');
        }
    }

    // 5. Chart Configuration Helpers
    Chart.defaults.color = '#cbd5e1';
    Chart.defaults.font.family = "'Outfit', sans-serif";

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: { padding: 20, color: '#f8fafc' }
            }
        }
    };

    // --- Gender Chart (Pie) ---
    const genderCounts = countBy(data, 'gender');
    new Chart(document.getElementById('genderChart'), {
        type: 'pie',
        data: {
            labels: Object.keys(genderCounts).map(g => g === 'Male' ? '男生' : '女生'),
            datasets: [{
                data: Object.values(genderCounts),
                backgroundColor: ['#6366f1', '#ec4899'],
                borderWidth: 0
            }]
        },
        options: commonOptions
    });

    // --- Preferred Position Chart (Doughnut) ---
    const posCounts = countMultiBy(data, 'position');
    const posLabels = {
        'Top': '上单 🛡️',
        'Jungle': '打野 ⚔️',
        'Mid': '中单 🔮',
        'ADC': '射手 🏹',
        'Support': '辅助 ➕',
        'Fill': '补位 🔄'
    };
    const posColors = {
        'Top': '#3b82f6',
        'Jungle': '#ef4444',
        'Mid': '#a855f7',
        'ADC': '#f59e0b',
        'Support': '#10b981',
        'Fill': '#6b7280'
    };
    new Chart(document.getElementById('positionChart'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(posCounts).map(k => posLabels[k] || k),
            datasets: [{
                data: Object.values(posCounts),
                backgroundColor: Object.keys(posCounts).map(k => posColors[k] || '#8b5cf6'),
                borderWidth: 0
            }]
        },
        options: { ...commonOptions, cutout: '65%' }
    });

    // --- Region Chart (Polar Area) ---
    const regionCounts = countBy(data, 'region');
    new Chart(document.getElementById('regionChart'), {
        type: 'polarArea',
        data: {
            labels: Object.keys(regionCounts),
            datasets: [{
                data: Object.values(regionCounts),
                backgroundColor: ['rgba(99,102,241,0.7)', 'rgba(168,85,247,0.7)', 'rgba(236,72,153,0.7)', 'rgba(16,185,129,0.7)', 'rgba(245,158,11,0.7)', 'rgba(59,130,246,0.7)'],
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.1)'
            }]
        },
        options: {
            ...commonOptions,
            scales: { r: { ticks: { display: false }, grid: { color: 'rgba(255,255,255,0.1)' } } }
        }
    });

    // --- Game Rank Chart (Bar) ---
    const rankCounts = countBy(data, 'rank');
    const rankLabels = {
        'Iron': '黑铁',
        'Bronze': '黄铜',
        'Silver': '白银',
        'Gold': '黄金',
        'Platinum': '铂金',
        'Emerald': '翡翠',
        'Diamond': '钻石',
        'Master': '大师',
        'Grandmaster': '宗师',
        'Challenger': '王者',
        'Unranked': '无段位/大乱斗'
    };
    new Chart(document.getElementById('rankChart'), {
        type: 'bar',
        data: {
            labels: Object.keys(rankCounts).map(k => rankLabels[k] || k),
            datasets: [{
                label: '段位人数',
                data: Object.values(rankCounts),
                backgroundColor: 'rgba(168,85,247,0.8)',
                borderRadius: 6
            }]
        },
        options: {
            ...commonOptions,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { stepSize: 1 } },
                x: { grid: { display: false } }
            }
        }
    });

    // --- Play Style Chart (Doughnut) ---
    const styleCounts = countMultiBy(data, 'playStyle');
    new Chart(document.getElementById('playStyleChart'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(styleCounts),
            datasets: [{
                data: Object.values(styleCounts),
                backgroundColor: ['#6366f1', '#ec4899', '#f59e0b', '#10b981'],
                borderWidth: 0
            }]
        },
        options: { ...commonOptions, cutout: '65%' }
    });

    // --- Voice Chat Chart (Pie) ---
    const voiceCounts = countBy(data, 'voiceChat');
    const voiceColors = {
        '可以开麦': '#10b981',
        '仅收听': '#3b82f6',
        '不方便连麦': '#ef4444'
    };
    new Chart(document.getElementById('voiceChart'), {
        type: 'pie',
        data: {
            labels: Object.keys(voiceCounts),
            datasets: [{
                data: Object.values(voiceCounts),
                backgroundColor: Object.keys(voiceCounts).map(k => voiceColors[k] || '#8b5cf6'),
                borderWidth: 0
            }]
        },
        options: commonOptions
    });

    // --- LOL Play Years Chart (Doughnut) ---
    const yearsCounts = countBy(data, 'playYears');
    const yearsLabels = {
        '< 1 year': '不到 1 年',
        '1-3 years': '1 - 3 年',
        '3-5 years': '3 - 5 年',
        '5-10 years': '5 - 10 年',
        '> 10 years': '10 年以上'
    };
    new Chart(document.getElementById('playYearsChart'), {
        type: 'doughnut',
        data: {
            labels: Object.keys(yearsCounts).map(k => yearsLabels[k] || k),
            datasets: [{
                data: Object.values(yearsCounts),
                backgroundColor: ['#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b'],
                borderWidth: 0
            }]
        },
        options: { ...commonOptions, cutout: '70%' }
    });

    // --- Active Time (List) ---
    const activeTimeList = document.getElementById('activeTimeList');
    if (activeTimeList) {
        const times = data.map(d => d.activeTime).filter(t => t);
        if (times.length === 0) {
            activeTimeList.innerHTML = '<li style="font-style: italic;">暂无填写记录</li>';
        } else {
            const uniqueTimes = [...new Set(times)];
            activeTimeList.innerHTML = uniqueTimes.slice(0, 15).map(t => {
                return `<li style="background: rgba(255,255,255,0.05); padding: 0.5rem 0.8rem; border-radius: 8px; border-left: 3px solid var(--primary-color);">${t}</li>`;
            }).join('');
        }
    }

    // --- Favorite Champions list (Tags) ---
    const favChampsContainer = document.getElementById('favChampionsList');
    const allChamps = [];
    if (favChampsContainer) {
        const validChamps = data
            .map(d => d.favoriteChampions ? d.favoriteChampions.trim() : '')
            .filter(c => c && c.toLowerCase() !== '无' && c.toLowerCase() !== 'none');
        
        validChamps.forEach(str => {
            const parts = str.split(/[,，\s\+]+/);
            parts.forEach(p => {
                const name = p.trim();
                if (name) allChamps.push(name);
            });
        });

        if (totalMembers === 0) {
            favChampsContainer.innerHTML = '<div style="color: #cbd5e1; font-style: italic; font-size: 1.1rem; padding: 1rem 0;">暂无提交数据，无法分析常用英雄</div>';
        } else if (allChamps.length === 0) {
            favChampsContainer.innerHTML = '<div style="color: #cbd5e1; font-style: italic; font-size: 1.1rem; padding: 1rem 0;">大家好像都很低调，没有填写本命英雄~</div>';
        } else {
            const freq = {};
            allChamps.forEach(c => {
                freq[c] = (freq[c] || 0) + 1;
            });
            
            favChampsContainer.innerHTML = Object.entries(freq)
                .sort((a, b) => b[1] - a[1])
                .map(([item, count]) => {
                    const countBadge = count > 1 ? ` <span style="background: rgba(255,255,255,0.2); padding: 0.1rem 0.4rem; border-radius: 50%; font-size: 0.8rem;">${count}</span>` : '';
                    return `<span class="restriction-tag">${item}${countBadge}</span>`;
                })
                .join('');
        }
    }

    // --- Age Distribution (Line) ---
    const ageGroups = {
        '18-22': 0, '23-26': 0, '27-30': 0, '31-35': 0, '36-40': 0, '40+': 0
    };
    data.forEach(d => {
        const a = parseInt(d.age);
        if(isNaN(a)) return;
        if(a <= 22) ageGroups['18-22']++;
        else if(a <= 26) ageGroups['23-26']++;
        else if(a <= 30) ageGroups['27-30']++;
        else if(a <= 35) ageGroups['31-35']++;
        else if(a <= 40) ageGroups['36-40']++;
        else ageGroups['40+']++;
    });
    
    new Chart(document.getElementById('ageChart'), {
        type: 'line',
        data: {
            labels: Object.keys(ageGroups),
            datasets: [{
                label: '年龄段人数',
                data: Object.values(ageGroups),
                borderColor: '#ec4899',
                backgroundColor: 'rgba(236,72,153,0.2)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#ec4899',
                pointRadius: 5
            }]
        },
        options: {
            ...commonOptions,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { stepSize: 1 } },
                x: { grid: { color: 'rgba(255,255,255,0.05)' } }
            }
        }
    });

    // 6. Export Center Logic
    if (isAdmin) {
        // Elements
        const exportSumTxtBtn = document.getElementById('exportSumTxtBtn');
        const exportSumCsvBtn = document.getElementById('exportSumCsvBtn');
        const exportRawTxtBtn = document.getElementById('exportRawTxtBtn');
        const exportRawCsvBtn = document.getElementById('exportRawCsvBtn');

        // File download helper
        function downloadFile(content, fileName, contentType) {
            const a = document.createElement("a");
            const file = new Blob([content], { type: contentType });
            a.href = URL.createObjectURL(file);
            a.download = fileName;
            a.click();
            URL.revokeObjectURL(a.href);
        }

        // CSV escaper
        function escapeCSV(val) {
            if (val === undefined || val === null) return '';
            let str = String(val);
            str = str.replace(/"/g, '""');
            if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
                return `"${str}"`;
            }
            return str;
        }

        // 1) Export Summary TXT
        exportSumTxtBtn.addEventListener('click', () => {
            let summaryTxt = "====== LOL 欧服群友数据看板汇总报告 ======\n";
            summaryTxt += `报告生成时间: ${new Date().toLocaleString()}\n`;
            summaryTxt += `总参与人数: ${totalMembers} 人\n`;
            summaryTxt += `平均年龄: ${avgAge} 岁\n`;
            summaryTxt += `能开麦玩家比例: ${micRatio}%\n`;
            summaryTxt += "======================================\n\n";

            if (totalMembers > 0) {
                summaryTxt += "1. 性别比例 (Gender)\n";
                const genders = countBy(data, 'gender');
                Object.entries(genders).forEach(([k, v]) => {
                    summaryTxt += `  - ${k === 'Male' ? '男生' : '女生'}: ${v}人 (${Math.round(v/totalMembers*100)}%)\n`;
                });
                summaryTxt += "\n";

                summaryTxt += "2. 主要擅长位置 (Roles)\n";
                const positions = countBy(data, 'position');
                const posLabels = { 'Top': '上单 🛡️', 'Jungle': '打野 ⚔️', 'Mid': '中单 🔮', 'ADC': '射手 🏹', 'Support': '辅助 ➕', 'Fill': '补位 🔄' };
                Object.entries(positions).forEach(([k, v]) => {
                    summaryTxt += `  - ${posLabels[k] || k}: ${v}人 (${Math.round(v/totalMembers*100)}%)\n`;
                });
                summaryTxt += "\n";

                summaryTxt += "3. 段位分布 (Rank)\n";
                const ranks = countBy(data, 'rank');
                const rankLabels = { 'Iron': '黑铁', 'Bronze': '黄铜', 'Silver': '白银', 'Gold': '黄金', 'Platinum': '铂金', 'Emerald': '翡翠', 'Diamond': '钻石', 'Master': '大师', 'Grandmaster': '宗师', 'Challenger': '王者', 'Unranked': '无段位/大乱斗' };
                Object.entries(ranks).forEach(([k, v]) => {
                    summaryTxt += `  - ${rankLabels[k] || k}: ${v}人 (${Math.round(v/totalMembers*100)}%)\n`;
                });
                summaryTxt += "\n";

                summaryTxt += "4. 游戏偏好 (Preference)\n";
                const styles = countMultiBy(data, 'playStyle');
                Object.entries(styles).forEach(([k, v]) => {
                    summaryTxt += `  - ${k}: ${v}人 (${Math.round(v/totalMembers*100)}%)\n`;
                });
                summaryTxt += "\n";

                summaryTxt += "5. 开麦连麦情况 (Voice Chat)\n";
                const voice = countBy(data, 'voiceChat');
                Object.entries(voice).forEach(([k, v]) => {
                    summaryTxt += `  - ${k}: ${v}人 (${Math.round(v/totalMembers*100)}%)\n`;
                });
                summaryTxt += "\n";

                summaryTxt += "6. LOL 游戏机龄 (Play Years)\n";
                const years = countBy(data, 'playYears');
                const yearsLabels = { '< 1 year': '不到 1 年', '1-3 years': '1-3 年', '3-5 years': '3-5 年', '5-10 years': '5-10 年', '> 10 years': '10 年以上' };
                Object.entries(years).forEach(([k, v]) => {
                    summaryTxt += `  - ${yearsLabels[k] || k}: ${v}人 (${Math.round(v/totalMembers*100)}%)\n`;
                });
                summaryTxt += "\n";

                summaryTxt += "7. 常用英雄频次汇总 (Favorite Champions)\n";
                const champFreq = {};
                allChamps.forEach(c => { champFreq[c] = (champFreq[c] || 0) + 1; });
                Object.entries(champFreq).sort((a,b)=>b[1]-a[1]).forEach(([k, v]) => {
                    summaryTxt += `  - ${k}: ${v}人次\n`;
                });
            } else {
                summaryTxt += "暂无收集到问卷数据。\n";
            }

            downloadFile(summaryTxt, "LOL欧服数据看板汇总报告.txt", "text/plain;charset=utf-8;");
        });

        // 2) Export Summary CSV
        exportSumCsvBtn.addEventListener('click', () => {
            let summaryCsv = "\uFEFF指标分类,属性项,统计数值,占比比例\n";
            summaryCsv += `基本统计,总参与人数,${totalMembers}人,-\n`;
            summaryCsv += `基本统计,平均年龄,${avgAge}岁,-\n`;
            summaryCsv += `基本统计,能开麦玩家比例,${micRatio}%,-\n`;

            if (totalMembers > 0) {
                // Genders
                const genders = countBy(data, 'gender');
                Object.entries(genders).forEach(([k, v]) => {
                    summaryCsv += `性别比例,${k === 'Male' ? '男生' : '女生'},${v}人,${Math.round(v/totalMembers*100)}%\n`;
                });

                // Positions
                const positions = countBy(data, 'position');
                const posLabels = { 'Top': '上单', 'Jungle': '打野', 'Mid': '中单', 'ADC': '射手', 'Support': '辅助', 'Fill': '补位' };
                Object.entries(positions).forEach(([k, v]) => {
                    summaryCsv += `主要位置,${posLabels[k] || k},${v}人,${Math.round(v/totalMembers*100)}%\n`;
                });

                // Ranks
                const ranks = countBy(data, 'rank');
                const rankLabels = { 'Iron': '黑铁', 'Bronze': '黄铜', 'Silver': '白银', 'Gold': '黄金', 'Platinum': '铂金', 'Emerald': '翡翠', 'Diamond': '钻石', 'Master': '大师', 'Grandmaster': '宗师', 'Challenger': '王者', 'Unranked': '无段位/大乱斗' };
                Object.entries(ranks).forEach(([k, v]) => {
                    summaryCsv += `段位分布,${rankLabels[k] || k},${v}人,${Math.round(v/totalMembers*100)}%\n`;
                });

                // Styles
                const styles = countBy(data, 'playStyle');
                Object.entries(styles).forEach(([k, v]) => {
                    summaryCsv += `游戏偏好,${k},${v}人,${Math.round(v/totalMembers*100)}%\n`;
                });

                // Voice
                const voice = countBy(data, 'voiceChat');
                Object.entries(voice).forEach(([k, v]) => {
                    summaryCsv += `连麦情况,${k},${v}人,${Math.round(v/totalMembers*100)}%\n`;
                });
            }

            downloadFile(summaryCsv, "LOL欧服数据看板汇总报告.csv", "text/csv;charset=utf-8;");
        });

        // 3) Export Raw Txt
        exportRawTxtBtn.addEventListener('click', () => {
            let txtContent = "====== LOL 欧服群友明细报表 ======\n";
            txtContent += `导出时间: ${new Date().toLocaleString()}\n`;
            txtContent += `总参与人数: ${data.length}\n`;
            txtContent += "======================================\n\n";

            if (data.length > 0) {
                data.forEach((d, idx) => {
                    txtContent += `[序号 ${idx + 1}] 群友提交明细\n`;
                    txtContent += `--------------------------------------\n`;
                    txtContent += `微信昵称: ${d.nickname || '-'}\n`;
                    txtContent += `微信 ID: ${d.wechatId || '-'}\n`;
                    txtContent += `游戏 ID (Riot ID): ${d.gameId || '-'}\n`;
                    txtContent += `邮箱: ${d.email || '-'}\n`;
                    txtContent += `年龄: ${d.age || '-'}\n`;
                    txtContent += `性别: ${d.gender === 'Male' ? '男生' : '女生'}\n`;
                    txtContent += `国家/地区: ${d.region || '-'}\n`;
                    txtContent += `LOL 游戏机龄: ${d.playYears || '-'}\n`;
                    txtContent += `游戏段位: ${d.rank || '-'}\n`;
                    txtContent += `擅长位置: ${d.position || '-'}\n`;
                    txtContent += `活跃时间: ${d.activeTime || '-'}\n`;
                    txtContent += `游戏偏好: ${d.playStyle || '-'}\n`;
                    txtContent += `连麦情况: ${d.voiceChat || '-'}\n`;
                    txtContent += `常用英雄: ${d.favoriteChampions || '-'}\n`;
                    txtContent += `提交时间: ${d.timestamp ? new Date(d.timestamp).toLocaleString('zh-CN') : '-'}\n`;
                    txtContent += "======================================\n\n";
                });
            } else {
                txtContent += "暂无详细提交数据。\n";
            }
            downloadFile(txtContent, "LOL欧服群友明细报表.txt", "text/plain;charset=utf-8;");
        });

        // 4) Export Raw CSV
        exportRawCsvBtn.addEventListener('click', () => {
            const headers = ["微信昵称", "微信 ID", "游戏 ID (Riot ID)", "邮箱", "年龄", "性别", "国家/地区", "LOL 游玩年限", "游戏段位", "擅长位置", "活跃时段", "游戏偏好", "开麦语音", "本命英雄", "提交时间"];
            let csvContent = "\uFEFF" + headers.join(",") + "\n";
            
            data.forEach(d => {
                const row = [
                    d.nickname,
                    d.wechatId,
                    d.gameId,
                    d.email,
                    d.age,
                    d.gender === 'Male' ? '男生' : '女生',
                    d.region,
                    d.playYears,
                    d.rank,
                    d.position,
                    d.activeTime,
                    d.playStyle,
                    d.voiceChat,
                    d.favoriteChampions,
                    d.timestamp ? new Date(d.timestamp).toLocaleString('zh-CN') : ''
                ];
                csvContent += row.map(escapeCSV).join(",") + "\n";
            });
            downloadFile(csvContent, "LOL欧服群友明细报表.csv", "text/csv;charset=utf-8;");
        });
    }

});

// Utility function to group and count occurrences
function countBy(arr, prop) {
    return arr.reduce((acc, obj) => {
        const key = obj[prop];
        if (!key) return acc;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});
}

// Utility function for multi-select CSV-separated values
function countMultiBy(arr, prop) {
    return arr.reduce((acc, obj) => {
        const val = obj[prop];
        if (!val) return acc;
        const parts = val.split(/,\s*/);
        parts.forEach(key => {
            if (!key) return;
            acc[key] = (acc[key] || 0) + 1;
        });
        return acc;
    }, {});
}
